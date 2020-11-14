import { BaseToolbarComponent } from "./base/baseToolbarComponent.js";
import { getPositionWithinEquallySpacedObjects } from "../tools.js"
import { sendResourceUpdateMessage } from "../networking.js"

export class InfoToolbar extends BaseToolbarComponent {
    constructor(sprite_handler, width_px, height_px, x, y) {
        super(sprite_handler, "towerinfo", width_px, height_px, x, y)
        this.dragTowerInfoContainer = new PIXI.Container();
        this.placedTowerInfoContainer = new PIXI.Container();

        this.yOffsetGap = 20
    }

    loadData() {
        let _this = this
        return new Promise((resolve) => {
            $.getJSON("shared/json/towers.json", function (data) {
                _this.towerJson = data
                _this.setupToolbarComponents()
                resolve()
            })
        })
    }

    setupToolbarComponents() {
        // Drag tower components
        let towerDescriptionContainer = this.renderTowerInfo()
        this.dragTowerInfoContainer.addChild(towerDescriptionContainer)

        let setTowerButtonsContainer = this.renderSetTowerButton()
        setTowerButtonsContainer.y += towerDescriptionContainer.getBounds().height + setTowerButtonsContainer.getBounds().height/2 + 20 // Note that bounds ignore display objects that are not visible
        this.dragTowerInfoContainer.addChild(setTowerButtonsContainer)

        // Placed tower components
        let towerAimButtonsContainer = this.renderTowerAimButtons()
        this.placedTowerInfoContainer.addChild(towerAimButtonsContainer)

        this.playerTowerStatsContainer = this.renderPlayerTowerStats() // This container is kept as a property of the class, since it needs to be referenced when updated
        this.placedTowerInfoContainer.addChild(this.playerTowerStatsContainer)
        this.playerTowerStatsContainer.y += towerAimButtonsContainer.getBounds().height + 15 //this.playerTowerStatsContainer.getBounds().height/2 + 10

        // Then hide them because shouldn't show up until towers are interacted with
        this.hideTowerInfo()
        this.hidePlacedTowerInfo()
    }

    // Main container holds toolbar sprite
    // Drag tower container displays info about the tower the player is currently placing
    // Placed tower container displays info about the tower the player owns and has clicked on
    registerContainer() {
        super.registerContainer()
        this.container.addChild(this.dragTowerInfoContainer)
        this.container.addChild(this.placedTowerInfoContainer)
    }

    showTowerInfo(towerType) {
        this.dragTowerInfoContainer.children.forEach(container => {
            container.children.forEach(sprite => {
                if (sprite.name == "towerInfo") {
                    if (sprite.type == towerType) {
                        sprite.visible = true
                    }
                } else {
                    sprite.visible = true
                }
            })
        });
    }

    hideTowerInfo() {
        this.dragTowerInfoContainer.children.forEach(container => {
            container.children.forEach(sprite => {
                sprite.visible = false
            })
        })
    }

    showPlacedTowerInfo() {
        this.placedTowerInfoContainer.children.forEach(container => {
            container.children.forEach(sprite => {
                sprite.visible = true
            })
        })
    }

    hidePlacedTowerInfo() {
        this.placedTowerInfoContainer.children.forEach(container => {
            container.children.forEach(sprite => {
                sprite.visible = false
            })
        })
    }

    getButton(width_px, height_px, x, y, message="", fontSize=20, col="0xAA88DD") {
        let graphics = new PIXI.Graphics();
        graphics.beginFill(col)
        graphics.drawRect(0, 0, width_px, height_px)
        graphics.x = x - width_px/2
        graphics.y = y - height_px/2
        graphics.interactive = true
        graphics.buttonMode = true

        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: fontSize,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: width_px * 0.8
        }
        let text = new PIXI.Text(message, defaultStyle);
        text.anchor.set(0.5)
        text.x = width_px/2
        text.y = height_px/2

        graphics.addChild(text)
        return graphics
    }

    renderTowerInfo() {
        let localContainer = new PIXI.Container()
        let xMargin = 10

        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: this.width_px - xMargin
        }
        let defaultX = this.width_px/2

        // Title
        let text = new PIXI.Text('Tower Info', defaultStyle);
        text.x = Math.floor(defaultX)
        text.y = Math.floor(0)
        text.anchor.set(0.5)
        localContainer.addChild(text);

        for (let i = 0; i < this.towerJson.length; i++) {
            let yOffset = 0
            let towerInfo = this.towerJson[i]["displayInfo"]
            for (let key in towerInfo) {
                yOffset += this.yOffsetGap

                // Description title
                text = new PIXI.Text(key, defaultStyle);
                text.x = Math.floor(xMargin)
                text.y = Math.floor(yOffset)
                text.type = i
                text.name = "towerInfo"
                text.style.fontSize = 16
                localContainer.addChild(text);

                // Description content
                text = new PIXI.Text(towerInfo[key], defaultStyle);
                text.x = Math.floor(this.width_px - xMargin)
                text.y = Math.floor(yOffset)
                text.anchor.set(1, 0) // Shift right
                text.style.fontWeight = "normal"
                text.style.fontSize = 16
                text.type = i
                text.name = "towerInfo"
                localContainer.addChild(text);
            }
        }
        return localContainer
    }

    renderTowerAimButtons() {
        let localContainer = new PIXI.Container()
        let yOffset = 0

        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: 16,
            fontWeight: 'bold'
        }
        let text = new PIXI.Text("Aim Behaviour", defaultStyle);
        text.anchor.set(0.5)
        text.x = this.width_px/2
        localContainer.addChild(text)

        let behaviours = ["first", "last", "fastest", "closest"]
        let buttonsPerRow = 2
        behaviours.forEach((behaviour, idx) => {
            yOffset += (this.yOffsetGap*((idx+1)%2))
            let width = 55
            let height = 15
            let newButton =  this.getButton(width, height, getPositionWithinEquallySpacedObjects(idx+1, buttonsPerRow, 32, this.width_px), yOffset, behaviour, height*0.8)

            let _this = this
            newButton.on("click", function () {
                sendResourceUpdateMessage("tower", _this.sprite_handler.getActiveClickable().name, [
                    {
                        "property" : "aimBehaviour",
                        "newValue" : behaviour
                    }
                ]) // TODO don't use strings, use enum
            })
            localContainer.addChild(newButton)
        })
        return localContainer
    }

    renderPlayerTowerStats() {
        let localContainer = new PIXI.Container()
        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: 16,
            fontWeight: 'bold'
        }
        let text = new PIXI.Text("Tower Stats", defaultStyle);
        text.anchor.set(0.5)
        text.x = this.width_px/2 // TODO maybe do this up above when setting y for all?
        localContainer.addChild(text)

        let yOffset = 0
        let xMargin = 10

        // The stats that are sent from server. Need to link this up with the stats set in the tower class server side
        let towerStats = {
            "kills": 0
        }

        for (let key in towerStats) {
            yOffset += 10

            // Description title
            let textValue = key.charAt(0).toUpperCase() + key.slice(1);
            text = new PIXI.Text(textValue, defaultStyle);
            text.x = Math.floor(xMargin)
            text.y = Math.floor(yOffset)
            text.name = key
            text.type = "key"
            text.style.fontSize = 14
            localContainer.addChild(text);

            // Description content - this is updated
            text = new PIXI.Text(towerStats[key], defaultStyle);
            text.x = Math.floor(this.width_px - xMargin)
            text.y = Math.floor(yOffset)
            text.anchor.set(1, 0) // Shift right
            text.style.fontWeight = "normal"
            text.style.fontSize = 14
            text.name = key
            text.type = "value"
            localContainer.addChild(text);
        }

        return localContainer
    }

    /**
     * The button that you press to confirm tower placement
     */
    renderSetTowerButton() {
        let localContainer = new PIXI.Container()
        let yOffset = 0

        let buttonHeight = this.width_px*0.4
        let buttonWidth = this.width_px*0.4
        let confirmButton =  this.getButton(buttonWidth, buttonHeight, getPositionWithinEquallySpacedObjects(1, 2, buttonWidth, this.width_px), yOffset, "\u{1F5F8}" , 40, "0x22FF22")
        let _this = this
        confirmButton.on("click", function () {
            _this.sprite_handler.getActiveClickable().emit("place")
        })
        localContainer.addChild(confirmButton)

        let cancelButton =  this.getButton(buttonWidth, buttonHeight, getPositionWithinEquallySpacedObjects(2, 2, buttonWidth, this.width_px), yOffset, "\u{2717}", 40, "0xFF2222")
        cancelButton.on("click", function () {
            _this.sprite_handler.getActiveClickable().emit("clear")
        })
        localContainer.addChild(cancelButton)

        return localContainer
    }

    update() {
        if (this.sprite_handler.isActiveClickableSet()) {
            let towerStats = this.sprite_handler.getActiveClickable().stats
            for (let key in towerStats) {
                this.playerTowerStatsContainer.children.forEach((statText) => {
                    if (statText.name == key && statText.type == "value") {
                        statText.text = towerStats[key].toString()
                    }
                })
            }
        }
    }
}
