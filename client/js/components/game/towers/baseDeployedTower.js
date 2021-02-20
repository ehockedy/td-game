import { BaseInteractiveTower } from "./baseInteractiveTower.js"
import { TowerInfoComponent } from "../towerInfoComponent.js"

export class BaseDeployedTower extends BaseInteractiveTower {
    constructor(type, name, towerConfig, playerID, x, y) {
        super(type, name, towerConfig)

        this.playerID = playerID
        this.x = x
        this.y = y

        // Interaction behaviours
        this.towerSprite
             .on("click", () => { this._onClick() })

        this.setInfoPopup()
        this.hideInfoContainer()
    }

    // The info and buttons that user can manage tower with
    setInfoPopup() {
        this.infoContainer = new TowerInfoComponent(this.name)
        this.addChild(this.infoContainer)
    }

    showInfoContainer() {
        this.infoContainer.visible = true
    }

    hideInfoContainer() {
        this.infoContainer.visible = false
    }

    toggleInfoContainer() {
        this.infoContainer.visible = !this.infoContainer.visible
    }

    _onClick() {
        this.observers.forEach((o) => { o.emit("clickDeployedTower", this) })
    }

    update(infoContainerStats) {
        if (this.infoContainer) {
            this.infoContainer.update(infoContainerStats)
        }
    }
}
