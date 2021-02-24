import { BaseInteractiveTower } from "./base/baseInteractiveTower.js"
import { TowerInfoComponent } from "../towerInfoComponent.js"

// Tower class that represnets a tower placed on the map
export class DeployedTower extends BaseInteractiveTower {
    constructor(type, name, towerConfig, playerID) {
        super(type, name, towerConfig)
        this.playerID = playerID

        // Interaction behaviours
        this.towerSprite
             .on("click", () => { this._onClick() })

        this.setInfoPopup()
        this.hideInfoContainer()
        this.init()
    }

    disableInteractivity() {
        this.interactive = false
        this.buttonMode = false
    }

    init() {
        switch(this.type) {
            case "shrapnel-burst":
                this._initShrapnelBurst()
            default:
                this._init()
        }
    }

    tick() {
        switch(this.type) {
            case "shrapnel-burst":
                this._tickShrapnelBurst()
            default:
                this._tick()
        }
    }

    shoot() {
        switch(this.type) {
            case "shrapnel-burst":
                this._shootShrapnelBurst()
            default:
                this._shoot()
        }
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


    // Type specific init functions
    _init() {}

    _initShrapnelBurst() {
        this.spinTickCount = 0
        this.spinTickCountMax = 10 // Frames
        this.isSpinning = false
        this.extraSpinAngleTop = 0 // Additional spin angle so each tower is slightly different
        this.extraSpinAngleMid = 0
        this.extraSpinAngleBot = 0
    }

    // Type specific tick functions
    _tick() {}

    _tickShrapnelBurst() {
        if (this.isSpinning) {
            this.bottomLayer.angle += 15 + this.extraSpinAngleBot
            this.middleLayer.angle -= 20 + this.extraSpinAngleMid
            this.topLayer.angle += 25 + this.extraSpinAngleTop

            this.spinTickCount += 1

            if (this.spinTickCount >= this.spinTickCountMax) {
                this.isSpinning = false
                this.spinTickCount = 0
            }
        }
    }

    // Type specific tick functions
    _shoot() {}

    _shootShrapnelBurst() {
        if (!this.isSpinning) {
            this.isSpinning = true
            this.extraSpinAngleTop = Math.floor(Math.random()*5)
            this.extraSpinAngleMid = Math.floor(Math.random()*5)
            this.extraSpinAngleBot = Math.floor(Math.random()*5)
        }
    }
}
