import { BaseComponent } from "../../../base/baseComponent.js";

export class BaseTower extends BaseComponent {
    constructor(type, name, towerConfig, colour) {
        super(name)
        this.type = type

        // TODO towerConfig should be for just the tower of the given type
        let textures = PIXI.Loader.shared.resources[towerConfig[type].textureAtlasFile].textures
        this.textureSize = 64  // Not necessarily the size of the texture, but the size of the space it sits in
        let baseTextures = []
        let spriteTextures = []
        for (let textureName in textures) {
            if (textureName.includes("base")) baseTextures.push(textures[textureName])
            else spriteTextures.push(textures[textureName])
        }

        this.colour = colour

        // Create the sprites from the loaded textures
        // Store them all in their own containers for consistency
        this.towerSprite = this.getSpriteContainer(spriteTextures)  // This is the tower sprite graphic
        this.towerColourSprite = this.getBaseSpriteContainer(baseTextures, this.colour)  // This is the bit of colour that each tower has the indicate who it belongs to

        // Put all the sprites into a container
        this.towerSpriteContainer = new PIXI.Container()
        this.towerSpriteContainer.addChild(this.towerSprite)
        this.towerSpriteContainer.addChild(this.towerColourSprite)
        this.addChild(this.towerSpriteContainer)
    }

    setX(x) { this.x = x }
    setY(y) { this.y = y }
    setCol(col) { this.col = col }
    setRow(row) { this.row = row }
    setPosition(position) { this.position = position }

    getSpriteContainer(textures) {
        switch (this.type) {
            case "shrapnel-burst":
                return this._getSpriteShrapnelBurst(textures)
            case "buzzsaw":
                return this._getSpriteBuzzsaw(textures)
            default:
                return this._getSpriteDefault(textures)
        }
    }

    getBaseSpriteContainer(textures, colour) {
        let baseSprite
        switch (this.type) {
            default:
                baseSprite = this._getSpriteDefault(textures, colour)
        }
        return baseSprite
    }

    // Creates a basic sprite with a given tint
    _createSprite(texture, tint="0xFFFFFF") {
        let sprite = new PIXI.Sprite(texture)
        sprite.anchor.set(0.5)
        sprite.tint = tint
        sprite.baseTint = tint
        return sprite
    }

    // Type specific functions
    _getSpriteDefault(textures, tint="0xFFFFFF") {
        let spriteContainer = new PIXI.Container()
        let sprite = this._createSprite(textures[0], tint)
        spriteContainer.addChild(sprite)
        return spriteContainer
    }

    // Override base sprite generation method because this sprite is made of layers that move independently
    _getSpriteShrapnelBurst(textures) {
        let spriteContainer = new PIXI.Container()
        textures.forEach((texture) => {
            let textureName = texture.textureCacheIds[0]
            let sprite = this._createSprite(texture)
            if (textureName.includes("bottom")) this.bottomLayer = sprite
            else if (textureName.includes("middle")) this.middleLayer = sprite
            else if (textureName.includes("top")) this.topLayer = sprite
            spriteContainer.addChild(sprite)
        })
        return spriteContainer
    }

    _getSpriteBuzzsaw(textures) {
        let spriteContainer = new PIXI.Container()
        textures.forEach((texture) => {
            let textureName = texture.textureCacheIds[0]
            let sprite = this._createSprite(texture)
            if (textureName.includes("blade")) {
                sprite.anchor.set(0.5)
                this.blade = sprite
                sprite.x = sprite.width*0.6
            }
            spriteContainer.addChild(sprite)
        })
        return spriteContainer
    }

    setTint(tint) {
        this.towerSpriteContainer.children.forEach((subSprite) => {
            subSprite.children.forEach((sprite) => {
                sprite.tint = tint
            })
        })
    }

    resetTint() {
        this.towerSpriteContainer.children.forEach((subSprite) => {
            subSprite.children.forEach((sprite) => {
                sprite.tint = sprite.baseTint
            })
        })
    }
}
