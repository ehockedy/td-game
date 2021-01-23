import { BaseComponent } from "../base/baseComponent.js";

export class BaseTower extends BaseComponent {
    constructor(type, name, towerConfig) {
        super(name)
        this.type = type
        this.cost = towerConfig[type].cost

        let textures = PIXI.Loader.shared.resources[towerConfig[type].textureAtlas].textures
        let baseTextures = []
        let spriteTextures = []
        let shadowTextures = []
        for (let textureName in textures) {
            if (textureName.includes("base")) baseTextures.push(textures[textureName])
            else if (textureName.includes("shadow")) shadowTextures.push(textures[textureName])
            else spriteTextures.push(textures[textureName])
        }

        let range  = towerConfig[type].gameData.seekRange
        let randomColourCode = towerConfig["colour"]
        let textureSize = Object.values(textures)[0].width

        this.generateRangeSprite(range, textureSize)
        this.generateSprite(spriteTextures)
        if (baseTextures.length > 0) this.generateBaseSprite(baseTextures, randomColourCode)
        //this.applyShadowMask(shadowTextures, spriteTextures)
    }

    _getSprite(textures) {
        let sprite = textures.length > 0 ? new PIXI.AnimatedSprite(textures) : new PIXI.Sprite(textures[0])
        sprite.anchor.set(0.5)
        return sprite
    }

    generateSprite(textures) {
        this.addChild(this._getSprite(textures))
    }

    generateBaseSprite(textures, colour) {
        let baseSprite = this._getSprite(textures)
        baseSprite.tint = colour
        this.addChild(baseSprite)
    }

    generateRangeSprite(range, textureSize) { // TODO not all sprites may have range sprite
        let rangeCircle = new PIXI.Graphics();
        rangeCircle.beginFill("0xe74c3c") // Red
        rangeCircle.alpha = 0.5
        rangeCircle.drawCircle(0, 0, range * textureSize) // position 0, 0 of the graphics canvas
        rangeCircle.visible = false
        this.addChild(rangeCircle)
        this.rangeCircle = rangeCircle
    }

    // applyShadowMask(shadowTextures, spriteTextures) {
    //     let shadowSprite = this._getSprite(shadowTextures)
    //     let sprite = this._getSprite(spriteTextures)
    //     shadowSprite.mask = sprite
    //     shadowSprite.alpha = 0.7
    //     this.addChild(sprite, shadowSprite)
    //     this.shadowShape = sprite
    // }

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
