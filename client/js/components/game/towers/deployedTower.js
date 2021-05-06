import { BaseInteractiveTower } from "./base/baseInteractiveTower.js"

// Tower class that represnets a tower placed on the map
export class DeployedTower extends BaseInteractiveTower {
    constructor(type, name, x, y, towerConfig, playerID, colour) {
        super(type, name, towerConfig, colour)
        this.playerID = playerID

        this.shootAnimationCount = 0
        this.shootAnimationCountMax = 0
        this.animationFrames = []

        // Set position
        this.setX(x)
        this.setY(y)

        // This is a rotation of the object as a whole - does not actually affect the angle of the sprite
        // subsprites must be rotated for this to work
        this._rotation = 0

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
        this._rotation = rotation
        this.towerSpriteContainer.rotation = rotation
    }

    init() {
        // Set certain functions based on the type of tower that it is
        // Mainly concerns animation when shooting
        switch(this.type) {
            case "shrapnel-burst":
                this._initShrapnelBurst()
                this.tickFn = this._tickShrapnelBurst
                this.shootFn = this._shootShrapnelBurst
                break
            default:
                this._init()
                this.tickFn = this._tick
                this.shootFn = this._shoot
        }
    }

    tick() {
        this._rangeTick()
        this.tickFn()
    }

    shoot() {
        this.shootFn()
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
    _init() {
        this.shootAnimationCountMax = 15
        this._generateAnimationFrames()
    }

    _initShrapnelBurst() {
        this.spinTickCount = 0
        this.spinTickCountMax = 10 // Frames
        this.isSpinning = false
        this.extraSpinAngleTop = 0 // Additional spin angle so each tower is slightly different
        this.extraSpinAngleMid = 0
        this.extraSpinAngleBot = 0
    }

    // Type specific tick functions
    _tick() {
        // Advance generic shoot animation
        if (this.shootAnimationCount > 0) {
            const frame = this.shootAnimationCountMax - this.shootAnimationCount
            this.towerSpriteContainer.x = Math.cos(this._rotation) * this.animationFrames[frame]
            this.towerSpriteContainer.y = Math.sin(this._rotation) * this.animationFrames[frame]
            this.shootAnimationCount -= 1
        }
    }

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
    _shoot() {
        this.shootAnimationCount = this.shootAnimationCountMax
    }

    _shootShrapnelBurst() {
        if (!this.isSpinning) {
            this.isSpinning = true
            this.extraSpinAngleTop = Math.floor(Math.random()*5)
            this.extraSpinAngleMid = Math.floor(Math.random()*5)
            this.extraSpinAngleBot = Math.floor(Math.random()*5)
        }
    }

    // Some towers have animations when they shoot
    // It's a basic animation of recoiling back, for now
    // The animation works by setting a specific distance to move back to,
    // sharply moving back over the first few frames, and then slowly moving
    // forward
    _generateAnimationFrames() {
        const pullBackDistance = 15  // Move back to this maximum during the first number of frames
        const pullBackFrames = 0.1 * this.shootAnimationCountMax // Pull back over this first proportion of frames
        const pushForwardFrames = this.shootAnimationCountMax - pullBackFrames

        // Calculate the distances to be moved away when recoiling
        for (let i=1; i < pullBackFrames; i++) {
            this.animationFrames.push( (i/pullBackFrames) * pullBackDistance * -1)
        }

        // Calculate the distances to be away from starting position when returning to initial position
        for (let i=0; i <= pushForwardFrames; i++) {
            this.animationFrames.push( (1 - i/pushForwardFrames) * pullBackDistance * -1)
        }
    }
}
