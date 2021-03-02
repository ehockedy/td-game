import { BaseInteractiveTower } from "./base/baseInteractiveTower.js"
import { DeployedTowerButton } from "./ui/deployedTowerButton.js"

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
        let distaceFromTower = 40
        this.infoContainer = new PIXI.Container()

        let button2 = new DeployedTowerButton(this.name + "2", distaceFromTower, -Math.PI/6, 1, "0x3399DD")
        this.infoContainer.addChild(button2)
        
        let button1 = new DeployedTowerButton(this.name + "1", distaceFromTower, 0, 1, "0x2299BB")
        this.infoContainer.addChild(button1)

        let button3 = new DeployedTowerButton(this.name + "3", distaceFromTower, Math.PI/6, 1, "0x225599")
        this.infoContainer.addChild(button3)

        let button4 = new DeployedTowerButton(this.name + "4", distaceFromTower, 11*Math.PI/12, 1, "0x2277AA")
        this.infoContainer.addChild(button4)

        let button5 = new DeployedTowerButton(this.name + "5", distaceFromTower, -11*Math.PI/12, 1, "0x335588")
        this.infoContainer.addChild(button5)

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
        // if (this.infoContainer) {
        //     this.infoContainer.update(infoContainerStats)
        // }
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
