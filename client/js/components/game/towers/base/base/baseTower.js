import { BaseComponent } from "../../../base/baseComponent.js";

export class BaseTower extends BaseComponent {
    constructor(type, name, towerConfig) {
        super(name)
        this.type = type

        // TODO towerConfig should be for just the tower of the given type
        let textures = PIXI.Loader.shared.resources[towerConfig[type].textureAtlasFile].textures
        this.textureSize = Object.values(textures)[0].width
        let baseTextures = []
        let spriteTextures = []
        for (let textureName in textures) {
            if (textureName.includes("base")) baseTextures.push(textures[textureName])
            else spriteTextures.push(textures[textureName])
        }

        let randomColourCode = towerConfig["colour"]  // TODO I think colour should be passed in as a parameter, or as part of config in a better way

        this.towerSpriteContainer = new PIXI.Container()
        this.addChild(this.towerSpriteContainer)

        this.towerSprite = this.generateSprite(spriteTextures)
        this.towerSpriteContainer.addChild(this.towerSprite)

        if (baseTextures.length > 0) {
            this.towerColourSprite = this.generateBaseSprite(baseTextures, randomColourCode)
            this.towerSpriteContainer.addChild(this.towerColourSprite)
        }
    }

    setX(x) { this.x = x }
    setY(y) { this.y = y }
    setCol(col) { this.col = col }
    setRow(row) { this.row = row }
    setPosition(position) { this.position = position }

    _getSprite(textures) {
        switch (this.type) {
            case "shrapnel-burst":
                return this._getSpriteShrapnelBurst(textures)
            default:
                return this._getSpriteBasic(textures)
        }
    }

    _getColourSprite(textures) {
        switch (this.type) {
            default:
                return this._getSpriteBasic(textures)
        }
    }

    generateSprite(textures) {
        return this._getSprite(textures)
    }

    generateBaseSprite(textures, colour) {
        let baseSprite = this._getColourSprite(textures)
        baseSprite.tint = colour
        return baseSprite
    }

    // Type specific functions
    _getSpriteBasic(textures) {
        let sprite = textures.length > 0 ? new PIXI.AnimatedSprite(textures) : new PIXI.Sprite(textures[0])
        sprite.anchor.set(0.5)
        return sprite
    }

    // Override base sprite generation method because this sprite is made of layers that move independently
    _getSpriteShrapnelBurst(textures) {
        let spriteContainer = new PIXI.Container()
        spriteContainer.name = "tower"
        textures.forEach((texture) => {
            let textureName = texture.textureCacheIds[0]
            let sprite = new PIXI.Sprite(texture)
            sprite.anchor.set(0.5)
            if (textureName.includes("bottom")) this.bottomLayer = sprite
            else if (textureName.includes("middle")) this.middleLayer = sprite
            else if (textureName.includes("top")) this.topLayer = sprite
            spriteContainer.addChild(sprite)
        })
        return spriteContainer
    }
}
