import { BaseTower } from "./baseTower.js"

export class ShrapnelBurstTower extends BaseTower {
    constructor(name, towerConfig) {
        super("shrapnel-burst", name, towerConfig) // TODO should the tower type param be passed down?
        this.spinTickCount = 0
        this.spinTickCountMax = 10 // Frames
        this.isSpinning = false
        this.extraSpinAngleTop = 0 // Additional spin angle so each tower is slightly different
        this.extraSpinAngleMid = 0
        this.extraSpinAngleBot = 0
    }

    // Override base sprite generation method because this sprite is made of layers that move independently
    generateSprite(textures) {
        this.spriteContainer = new PIXI.Container()
        textures.forEach((texture) => {
            let textureName = texture.textureCacheIds[0]
            let sprite = new PIXI.Sprite(texture)
            sprite.anchor.set(0.5)
            if (textureName.includes("bottom")) this.bottomLayer = sprite
            else if (textureName.includes("middle")) this.middleLayer = sprite
            else if (textureName.includes("top")) this.topLayer = sprite
            this.spriteContainer.addChild(sprite)
        })
        this.addChild(this.spriteContainer)
    }

    generateBaseSprite(textures, colour) {
        let baseSprite = this._getSprite(textures)
        baseSprite.tint = colour
        this.topLayer.addChild(baseSprite)
    }

    tick() {
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

    onShoot() {
        if (!this.isSpinning) {
            this.isSpinning = true
            this.extraSpinAngleTop = Math.floor(Math.random()*5)
            this.extraSpinAngleMid = Math.floor(Math.random()*5)
            this.extraSpinAngleBot = Math.floor(Math.random()*5)
        }
    }
}