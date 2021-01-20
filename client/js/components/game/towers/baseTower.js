import { BaseComponent } from "../base/baseComponent.js";

export class BaseTower extends BaseComponent {
    constructor(type, name, towerConfig) {
        super(name)
        this.type = type
        this.textures = PIXI.Loader.shared.resources[towerConfig[type].textureAtlas].textures
        this.textureSize = Object.values(this.textures)[0].width
        this.cost = towerConfig[type].cost
        this.randomColourCode = towerConfig["colour"]

        let range = towerConfig[type].gameData.seekRange
        this.generateRangeSprite(range)
        this.generateSprite()
    }

    generateSprite() {
        let baseTextures = []
        let spriteTextures = []
        for (let textureName in this.textures) {
            if (textureName.includes("base")) baseTextures.push(this.textures[textureName])
            else spriteTextures.push(this.textures[textureName])
        }
        this.sprite = new PIXI.AnimatedSprite(spriteTextures)
        this.sprite.anchor.set(0.5)
        this.addChild(this.sprite)

        if (baseTextures.length > 0) {
            this.baseSprite = new PIXI.AnimatedSprite(baseTextures)
            this.baseSprite.anchor.set(0.5)
            this.baseSprite.tint = this.randomColourCode
            this.addChild(this.baseSprite)
        }
    }

    generateRangeSprite(range) { // TODO not all sprites may have range sprite
        this.rangeCircle = new PIXI.Graphics();
        this.rangeCircle.beginFill("0xe74c3c") // Red
        this.rangeCircle.alpha = 0.5
        this.rangeCircle.drawCircle(0, 0, range * this.textureSize) // position 0, 0 of the graphics canvas
        this.rangeCircle.visible = false
        this.addChild(this.rangeCircle)
    }

    showRangeCircle() {
        this.rangeCircle.visible = true
    }

    hideRangeCircle() {
        this.rangeCircle.visible = false
    }

    setInfoPopup(infoContainer) {
        this.infoContainer = infoContainer
        this.addChild(this.infoContainer)
    }

    showInfoContainer() {
        this.infoContainer.visible = true
    }

    hideInfoContainer() {
        this.infoContainer.visible = false
    }

    update(infoContainerStats) {
        if (this.infoContainer) {
            this.infoContainer.update(infoContainerStats)
        }
    }

    // What do to when the tower shoots
    onShoot() {}

    tick() {}
}
