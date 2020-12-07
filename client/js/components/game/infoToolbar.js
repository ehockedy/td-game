import { BaseToolbarComponent } from "./base/baseToolbarComponent.js";
import { getPositionWithinEquallySpacedObjects } from "../../tools.js"
import { sendResourceUpdateMessage } from "../../networking.js"
import { GraphicButton } from "../ui_common/button.js"
import { KeyValueInfo } from "../ui_common/keyValueInfo.js"

export class InfoToolbar extends BaseToolbarComponent {
    constructor(sprite_handler, width_px, height_px, x, y) {
        super(sprite_handler, "towerinfo", width_px, height_px, x, y)
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
        this.titleTowerInfo = this.renderTitle('Tower Info')
        this.container.addChild(this.titleTowerInfo)

        this.towerDescriptionContainer = this.renderTowerInfo()
        this.towerDescriptionContainer.y = this.titleTowerInfo.getBounds().height + 5
        this.container.addChild(this.towerDescriptionContainer)

        // Placed tower components
        this.titleAim = this.renderTitle('Aim Behaviour')
        this.container.addChild(this.titleAim)

        this.towerAimButtonsContainer = this.renderTowerAimButtons()
        this.towerAimButtonsContainer.y = this.titleAim.getBounds().height + 5
        this.container.addChild(this.towerAimButtonsContainer)

        this.titleStats = this.renderTitle('Tower Stats')
        this.titleStats.y = this.towerAimButtonsContainer.y + this.towerAimButtonsContainer.getBounds().height + 15
        this.container.addChild(this.titleStats)

        this.playerTowerStatsContainer = this.renderPlayerTowerStats()
        this.playerTowerStatsContainer.y = this.titleStats.y + this.titleStats.getBounds().height + 5
        this.container.addChild(this.playerTowerStatsContainer)

        // Then hide them because shouldn't show up until towers are interacted with
        this.hideDragTowerInfo()
        this.hidePlacedTowerInfo()
    }

    showDragTowerInfo(towerType) {
        this._setVisibilityDragTowerComponents(true)
        this.towerDescriptionContainer.children.forEach(tower => {
            if (tower.type == towerType) {
                tower.visible = true
            } else {
                tower.visible = false
            }
        });
    }

    hideDragTowerInfo() {
        this._setVisibilityDragTowerComponents(false)
    }

    showPlacedTowerInfo() {
        this._setVisibilityPlacedTowerComponents(true)
    }

    hidePlacedTowerInfo() {
        this._setVisibilityPlacedTowerComponents(false)
    }

    _setVisibilityDragTowerComponents(visibility) {
        this.titleTowerInfo.visible = visibility
        this.towerDescriptionContainer.visible = visibility
    }

    _setVisibilityPlacedTowerComponents(visibility) {
        this.titleStats.visible = visibility
        this.towerAimButtonsContainer.visible = visibility
        this.titleAim.visible = visibility
        this.playerTowerStatsContainer.visible = visibility
    }

    renderTitle(titleText) {
        let xMargin = 10

        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: this.width_px - xMargin
        }

        // Title
        let text = new PIXI.Text(titleText, defaultStyle);
        text.x = Math.floor(this.width_px/2)
        text.anchor.set(0.5, 0)
        return text
    }

    renderTowerInfo() {
        let localContainer = new PIXI.Container()
        let xMargin = 10
        for (let i = 0; i < this.towerJson.length; i++) {
            let yOffset = 0
            let towerInfo = this.towerJson[i]["displayInfo"]
            for (let key in towerInfo) {
                let info = new KeyValueInfo(key, towerInfo[key], this.width_px, xMargin, 16)
                info.y = Math.floor(yOffset)
                info.type = i
                localContainer.addChild(info)

                yOffset += this.yOffsetGap
            }
            let costInfo = new KeyValueInfo("Cost", this.towerJson[i]["cost"], this.width_px, xMargin, 16)
            costInfo.y = Math.floor(yOffset)
            costInfo.type = i
            localContainer.addChild(costInfo)
        }
        return localContainer
    }

    renderTowerAimButtons() {
        let localContainer = new PIXI.Container()
        let yOffset = 0

        let behaviours = ["first", "last", "fastest", "closest"]
        let buttonsPerRow = 2
        behaviours.forEach((behaviour, idx) => {
            let width = 55
            let height = 15
            let newButton =  new GraphicButton(width, height, getPositionWithinEquallySpacedObjects(idx+1, buttonsPerRow, 32, this.width_px), yOffset, behaviour, height*0.8, "0xAA4488", 0.5, 0)

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

            yOffset += (this.yOffsetGap*(idx%2))
        })
        return localContainer
    }

    renderPlayerTowerStats() {
        let localContainer = new PIXI.Container()
        let yOffset = 0
        let xMargin = 10

        // The stats that are sent from server. Need to link this up with the stats set in the tower class server side
        let towerStats = {
            "kills": 0
        }

        for (let key in towerStats) {

            let textValue = key.charAt(0).toUpperCase() + key.slice(1);
            let info = new KeyValueInfo(textValue, towerStats[key], this.width_px, xMargin, 16)
            info.y = yOffset
            localContainer.addChild(info);

            yOffset += 10

        }

        return localContainer
    }

    update() {
        if (this.sprite_handler.isActiveClickableSet()) {
            let towerStats = this.sprite_handler.getActiveClickable().stats
            for (let key in towerStats) {
                this.playerTowerStatsContainer.children.forEach((statText) => {
                    statText.setValue(towerStats[key].toString())
                })
            }
        }
    }
}
