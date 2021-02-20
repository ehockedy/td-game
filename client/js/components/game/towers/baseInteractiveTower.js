import { BaseTower } from "./baseTower.js"

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
        let rangeCircle = new PIXI.Graphics();
        rangeCircle.name = "rangeCircle"
        rangeCircle.beginFill("0xe74c3c") // Red
        rangeCircle.alpha = 0.5
        rangeCircle.drawCircle(0, 0, range * textureSize) // position 0, 0 of the graphics canvas
        rangeCircle.visible = false
        return rangeCircle
    }

    showRangeCircle() {
        this.rangeCircle.visible = true
    }

    hideRangeCircle() {
        this.rangeCircle.visible = false
    }

    subscribe(observer) {
        this.observers.push(observer)
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(item => item !== observer)
    }
}