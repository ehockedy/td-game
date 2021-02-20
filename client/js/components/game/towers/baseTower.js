import { BaseComponent } from "../base/baseComponent.js";

export class BaseTower extends BaseComponent {
    constructor(type, name, towerConfig) {
        super(name)
        this.type = type

        let textures = PIXI.Loader.shared.resources[towerConfig[type].textureAtlasFile].textures
        this.textureSize = Object.values(textures)[0].width
        let baseTextures = []
        let spriteTextures = []
        for (let textureName in textures) {
            if (textureName.includes("base")) baseTextures.push(textures[textureName])
            else spriteTextures.push(textures[textureName])
        }

        let randomColourCode = towerConfig["colour"]

        this.towerSprite = this.generateSprite(spriteTextures)
        this.addChild(this.towerSprite)

        if (baseTextures.length > 0) {
            this.towerColourSprite = this.generateBaseSprite(baseTextures, randomColourCode)
            this.addChild(this.towerColourSprite)
        }
    }

    setX(x) { this.x = x }
    setY(y) { this.y = y }
    setCol(col) { this.col = col }
    setRow(row) { this.row = row }
    setPosition(position) { this.position = position }

    _getSprite(textures) {
        let sprite = textures.length > 0 ? new PIXI.AnimatedSprite(textures) : new PIXI.Sprite(textures[0])
        sprite.anchor.set(0.5)
        return sprite
    }

    generateSprite(textures) {
        return this._getSprite(textures)
    }

    generateBaseSprite(textures, colour) {
        let baseSprite = this._getSprite(textures)
        baseSprite.tint = colour
        return baseSprite
    }

    // What do to when the tower shoots
    onShoot() {}

    tick() {}
}
