import { BaseTower } from "./baseTower.js"

export class ShrapnelBurstTower extends BaseTower {
    constructor(name, towerConfig) {
        super("shrapnel-burst", name, towerConfig) // TODO should the tower type param be passed down?
        this.spinTickCount = 0
        this.spinTickCountMax = 10 // Frames
        this.isSpinning = false
    }

    // Override base sprite generation method because this sprite is made of layers that move independently
    generateSprite() {
        let baseSprite
        for (let textureName in this.textures) {
            let sprite = new PIXI.Sprite(this.textures[textureName])
            sprite.anchor.set(0.5)
            if (textureName.includes("bottom")) this.bottomLayer = sprite
            else if (textureName.includes("middle")) this.middleLayer = sprite
            else if (textureName.includes("top")) this.topLayer = sprite
            else if (textureName.includes("base")) baseSprite = sprite
        }

        this.addChild(this.bottomLayer)
        this.addChild(this.middleLayer)
        this.addChild(this.topLayer)
        
        if (baseSprite) {
            baseSprite.tint = this.randomColourCode
            this.topLayer.addChild(baseSprite)
        }
    }

    tick() {
        if (this.isSpinning) {
            this.bottomLayer.angle += 15
            this.middleLayer.angle -= 20
            this.topLayer.angle += 25

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
        }
    }
}