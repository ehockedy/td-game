import { getBoard } from "../../state.js"
import { BaseComponent } from "./base/baseComponent.js"

export class MapComponent extends BaseComponent {
    constructor(cols, rows, towerSpriteSize, scalingFactor=1) {
        super("map")
        this.towerSpriteSize = towerSpriteSize
        this.scalingFactor = scalingFactor
        this.cols = cols
        this.rows = rows

        this.width_px = this.towerSpriteSize*this.scalingFactor*this.cols
        this.height_px = this.towerSpriteSize*this.scalingFactor*this.rows
    }

    getWidth() {
        return this.width_px
    }

    getHeight() {
        return this.height_px
    }

    constructMap() {
        this.removeChildren()
        const MAP_SPRITE_SIZE_X = this.towerSpriteSize*this.scalingFactor // Width of a sprite in the map spritesheet
        const MAP_SPRITE_SIZE_Y = this.towerSpriteSize*this.scalingFactor // Height of a sprite in the map spritesheet

        // A texture is a WebGL-ready image
        // Keep things in a texture cache to make rendering fast and efficient
        let mapTextures = PIXI.Loader.shared.resources["client/img/map_tiles.json"].textures
        let rocksTextures = PIXI.Loader.shared.resources["client/img/rocks.json"].textures

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Determine the sprite to used, based on tile type
                let textureName = "land_1.png" // Default to land
                switch(getBoard()[r][c]["value"]) {
                    case 1:
                    case 2:
                        textureName = "track_straight_1.png"
                        break
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                        textureName = "track_corner_1.png"
                        break
                    default:
                        break
                }

                // Determine angle to rotate, based on tile type
                let angleAdjustment = 0
                switch(getBoard()[r][c]["value"]) {
                    case 2:
                    case 4:
                        angleAdjustment = 90
                        break
                    case 5:
                        angleAdjustment = 180
                        break
                    case 6:
                        angleAdjustment = -90
                        break
                    default:
                        break
                }

                var map_square_sprite = new PIXI.Sprite(mapTextures[textureName]);
                map_square_sprite.y += r * MAP_SPRITE_SIZE_Y
                map_square_sprite.x += c * MAP_SPRITE_SIZE_X
                map_square_sprite.name = "map_" + r.toString() + "_" + c.toString()
                map_square_sprite.scale.set(this.scalingFactor)

                if (angleAdjustment) {
                    // Set the pivot point, then adjust offset
                    map_square_sprite.pivot.set(MAP_SPRITE_SIZE_X/2, MAP_SPRITE_SIZE_Y/2)
                    map_square_sprite.x += MAP_SPRITE_SIZE_X/2
                    map_square_sprite.y += MAP_SPRITE_SIZE_Y/2
                    map_square_sprite.angle += angleAdjustment
                }

                this.addChild(map_square_sprite);

                // Randomly add some rocks to path tiles
                if (getBoard()[r][c]["value"] != 0) {
                    let maxRocksPerMapSquare = 4
                    let rocksCount = Math.floor(Math.random() * maxRocksPerMapSquare) // 0 -> 3
                    for (let rockIdx=0; rockIdx < rocksCount; rockIdx += 1) {
                        let randKey = Object.keys(rocksTextures)[Math.floor(Math.random() * Object.keys(rocksTextures).length)]
                        let rockTexture = rocksTextures[randKey]
                        let rockSprite = new PIXI.Sprite(rockTexture)
                        rockSprite.x = Math.floor(Math.random() * (MAP_SPRITE_SIZE_X-rockTexture.width))
                        rockSprite.y = Math.floor(Math.random() * (MAP_SPRITE_SIZE_X-rockTexture.height))
                        if (angleAdjustment) {
                            rockSprite.pivot.set(rockTexture.width/2, rockTexture.height/2)
                            rockSprite.x += rockTexture.width/2
                            rockSprite.y += rockTexture.height/2
                            rockSprite.angle -= angleAdjustment // Undo the rotation given to the path tile, so all shadows face the same way
                        }
                        map_square_sprite.addChild(rockSprite);
                    }
                }
            }
        }
    }
}