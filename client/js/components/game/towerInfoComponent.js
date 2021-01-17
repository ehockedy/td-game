import { BaseComponent } from "./base/baseComponent.js"
import { getPositionWithinEquallySpacedObjects } from "../../tools.js"
import { sendResourceUpdateMessage } from "../../networking.js"
import { GraphicButton } from "../ui_common/button.js"
import { KeyValueInfo } from "../ui_common/keyValueInfo.js"

export class TowerInfoComponent extends BaseComponent {
    constructor(towerName) {
        super("towerinfo")
        this.stats = {
            "kills": 0
        }
        this.towerName = towerName
        this.setupToolbarComponents()
    }

    setupToolbarComponents() {
        this.towerAimButtonsContainer = this.renderTowerAimButtons()
        this.addChild(this.towerAimButtonsContainer)

        this.playerTowerStatsContainer = this.renderPlayerTowerStats()
        this.addChild(this.playerTowerStatsContainer)
    }

    renderTowerAimButtons() {
        let localContainer = new PIXI.Container()
        let yOffset = 0

        let behaviours = ["first", "last", "fastest", "closest"]
        behaviours.forEach((behaviour, idx) => {
            let width = 50
            let height = 15
            let totalHeight = (height + 5)*4
            let newButton =  new GraphicButton(width, height, 20, getPositionWithinEquallySpacedObjects(idx+1, behaviours.length, height, totalHeight) - totalHeight/2, behaviour, height*0.85, "0xAA4488", 0, 0.5)

            let _this = this
            newButton.on("click", function () {
                sendResourceUpdateMessage("tower", _this.towerName, [
                    {
                        "property" : "aimBehaviour",
                        "newValue" : behaviour
                    }
                ]) // TODO don't use strings, use enum
            })
            localContainer.addChild(newButton)

            yOffset += height + 5
        })
        return localContainer
    }

    renderPlayerTowerStats() {
        let localContainer = new PIXI.Container()
        let yOffset = 10
        let width = 60

        for (let key in this.stats) {
            let textValue = key.charAt(0).toUpperCase() + key.slice(1);
            let info = new KeyValueInfo(textValue, this.stats[key], 60, 0, 16)
            info.y = yOffset
            info.x = -width/2
            info.name = key
            localContainer.addChild(info);

            yOffset += 10
        }

        return localContainer
    }

    update(statsUpdate) {
        for (let key in this.stats) {
            this.stats[key] = statsUpdate[key]
            this.playerTowerStatsContainer.getChildByName(key).setValue(statsUpdate[key])
        }
    }
}
