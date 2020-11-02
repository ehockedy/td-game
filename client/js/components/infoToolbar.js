import { BaseToolbarComponent } from "./base/baseToolbarComponent.js";
import { getPositionWithinEquallySpacedObjects } from "../tools.js"
import { sendResourceUpdateMessage } from "../networking.js"

export class InfoToolbar extends BaseToolbarComponent {
    constructor(sprite_handler, width_px, height_px, x, y) {
        super(sprite_handler, "towerinfo", width_px, height_px, x, y)
        this.infoContainer = new PIXI.Container();

        this.defaultYGap = 20
    }

    loadData() {
        let _this = this
        let p = new Promise((resolve) => {
            $.getJSON("shared/json/towers.json", function (data) {
                _this.towerJson = data
                _this.renderTowerInfo()
                _this.renderTowerAimButtons()
                resolve()
            })
        })
        return p
    }

    // Main container holds toolbar sprite
    // This one holds the info displayed on the toolbar
    registerSecondaryContainer() {
        this.sprite_handler.registerContainer(this.infoContainer)
    }

    showTowerInfo(towerType) {
        this.infoContainer.children.forEach(sprite => {
            if (sprite.name == "towerInfo") {
                if (sprite.type == towerType) {
                    sprite.visible = true
                }
            } else {
                sprite.visible = true
            }
        });
    }

    removeTowerInfo() {
        this.infoContainer.children.forEach(sprite => {
            sprite.visible = false
        })
    }

    getButton(width_px, height_px, x, y, col="0xAA88DD") {
        let graphics = new PIXI.Graphics();
        graphics.beginFill(col)
        graphics.drawRect(0, 0, width_px, height_px)
        graphics.x = x - width_px/2
        graphics.y = y - height_px/2
        graphics.visible = false
        graphics.interactive = true
        graphics.buttonMode = true
        return graphics
    }

    renderTowerInfo() {
        let xMargin = 10

        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: this.width_px - xMargin
        }
        let defaultX = this.x + this.width_px/2

        // Title
        let text = new PIXI.Text('Tower Info', defaultStyle);
        text.x = Math.floor(defaultX)
        text.y = Math.floor(this.toolbarComponentsY)
        text.anchor.set(0.5)
        text.visible = false
        this.infoContainer.addChild(text);

        let defaultY = this.toolbarComponentsY
        for (let i = 0; i < this.towerJson.length; i++) {
            this.toolbarComponentsY = defaultY // Reset
            let towerInfo = this.towerJson[i]["displayInfo"]
            for (let key in towerInfo) {
                this.toolbarComponentsY += this.defaultYGap

                // Description title
                text = new PIXI.Text(key, defaultStyle);
                text.x = Math.floor(this.x + xMargin)
                text.y = Math.floor(this.toolbarComponentsY)
                text.type = i
                text.visible = false
                text.name = "towerInfo"
                text.style.fontSize = 16
                this.infoContainer.addChild(text);

                // Description content
                text = new PIXI.Text(towerInfo[key], defaultStyle);
                text.x = Math.floor(this.x + this.width_px - xMargin)
                text.y = Math.floor(this.toolbarComponentsY)
                text.anchor.set(1, 0) // Shift right
                text.style.fontWeight = "normal"
                text.style.fontSize = 16
                text.type = i
                text.visible = false
                text.name = "towerInfo"
                this.infoContainer.addChild(text);
            }
        }
    }

    renderTowerAimButtons() {
        this.toolbarComponentsY += this.defaultYGap
        let behaviours = ["last", "first", "fastest", "closest"]
        let buttonsPerRow = 2
        behaviours.forEach((behaviour, idx) => {
            this.toolbarComponentsY += (this.defaultYGap*((idx+1)%2))
            let newButton =  this.getButton(55, 15, this.x + getPositionWithinEquallySpacedObjects(idx+1, buttonsPerRow, 32, this.width_px), this.toolbarComponentsY)

            let _this = this
            newButton.on("click", function () {
                sendResourceUpdateMessage("tower", _this.sprite_handler.getActiveClickable().name, [
                    {
                        "property" : "aimBehaviour",
                        "newValue" : behaviour
                    }
                ]) // TODO don't use strings, use enum
            })
            this.infoContainer.addChild(newButton)
        })
    }

    // Externally called functions triggered by other components
    onTowerMenuPointerOver(towerType) {
        this.showTowerInfo(towerType)
    }

    onDraggableTowerClick(towerType) {
        this.showTowerInfo(towerType)
    }

    onTowerMenuPointerOff() {
        this.removeTowerInfo()
    }

    onDraggableTowerClickOff() {
        this.removeTowerInfo()
    }

}