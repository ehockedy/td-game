import { BaseTower } from "./base/baseTower.js"

// Base tower class the contains functionality for all interactive towers
export class BaseInteractiveTower extends BaseTower {
    constructor(type, name, towerConfig) {
        super(type, name, towerConfig)

        // Set the interactive elements
        // The towerSprite is the bit that is to be clicked
        this.interactive = true
        this.towerSprite.interactive = true
        this.towerSprite.buttonMode = true

        // Add a circle that shows the range the tower can detect enemies in
        let range = towerConfig[type].gameData.seekRange
        let textureSize = this.textureSize
        this.rangeCircle = this.generateRangeSprite(range, textureSize)
        this.addChildAt(this.rangeCircle, 0) // Add to front so rendered at bottom

        // A list of the observers to emit an event to if the tower is interacted with
        this.observers = []
    }

    generateRangeSprite(range, textureSize) {
        let rangeGraphics = new PIXI.Graphics()
        rangeGraphics.beginFill("0x000000", 0)
        rangeGraphics.lineStyle(5, "0x000000", 1, 0.5)

        let radius = range * textureSize
        let circumference = 2 * Math.PI * radius
        let dashWidth = 20
        let gapWidth = 40
        let dashesRequired = Math.floor(circumference / (dashWidth + gapWidth))
        let angleShift = (2 * Math.PI) / dashesRequired  // This is angle to move when drawing each dash
        let angleDeltaDash = angleShift * (dashWidth / (dashWidth + gapWidth))

        let currentAngle = 0
        for (let dashIdx = 0; dashIdx < dashesRequired; dashIdx += 1) {
            rangeGraphics.arc(0, 0, radius, currentAngle, currentAngle + angleDeltaDash)
            currentAngle += angleShift
            rangeGraphics.finishPoly()
        }
        rangeGraphics.visible = false
        return rangeGraphics
    }

    showRangeCircle() {
        this.rangeCircle.visible = true
    }

    hideRangeCircle() {
        this.rangeCircle.visible = false
    }

    toggleRangeCircle() {
        this.rangeCircle.visible = !this.rangeCircle.visible
    }

    subscribe(observer) {
        this.observers.push(observer)
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(item => item !== observer)
    }
}