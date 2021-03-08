import { BaseInteractiveTower } from "./base/baseInteractiveTower.js"

// Tower class that represnets a tower placed on the map
export class DeployedTower extends BaseInteractiveTower {
    constructor(type, name, towerConfig, playerID) {
        super(type, name, towerConfig)
        this.playerID = playerID

        // Interaction behaviours
        this.towerSprite
             .on("click", () => { this._onClick() })
        this.selected = false  // Whether this tower has been clicked on

        this.init()
    }

    disableInteractivity() {
        this.interactive = false
        this.buttonMode = false
    }

    setActive() {
        this.selected = true
        this.showRangeCircle()
    }

    unsetActive() {
        this.selected = false
        this.hideRangeCircle()
    }

    setRotation(rotation) {
        this.towerSprite.rotation = rotation
        this.towerColourSprite.rotation = rotation
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
        this._rangeTick()
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

    _onClick() {
        this.selected = !this.selected
        this.observers.forEach((o) => {
            if (this.selected) o.emit("clickDeployedTower", this)
            else o.emit("clickOffDeployedTower", this)
        })
    }

    update(stats) {
        this.stats = stats
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

    _rangeTick() {
        this.rangeCircle.angle += 0.1
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
