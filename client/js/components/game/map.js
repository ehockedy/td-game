import { getBoard } from "../../state.js"
import { BaseComponent } from "./base/baseComponent.js"

function getRandomObject(jsonObject) {
    let randKey = Object.keys(jsonObject)[Math.floor(Math.random() * Object.keys(jsonObject).length)]
    return jsonObject[randKey]
}

let PATH_DIRECTIONS = {
    TOP_LEFT:     0,
    TOP:          1,
    TOP_RIGHT:    2,
    LEFT:         3,
    RIGHT:        4,
    BOTTOM_RIGHT: 5,
    BOTTOM:       6,
    BOTTOM_LEFT:  7,
}

export class MapComponent extends BaseComponent {
    constructor(cols, rows, mapSpriteSize, scalingFactor=1) {
        super("map")
        this.mapSpriteSize = mapSpriteSize
        this.scalingFactor = scalingFactor
        this.cols = cols
        this.rows = rows

        this.width_px = this.mapSpriteSize*this.scalingFactor*this.cols
        this.height_px = this.mapSpriteSize*this.scalingFactor*this.rows
        this.scale.set(scalingFactor)

        this.pathTiles = new PIXI.Container()
        this.shadowTiles = new PIXI.Container()
        this.sideWalls = new PIXI.Container()
        this.topWalls = new PIXI.Container()
        this.landTiles = new PIXI.Container()

        // A texture is a WebGL-ready image
        // Keep things in a texture cache to make rendering fast and efficient
        this.mapTextures = PIXI.Loader.shared.resources["client/img/map_tiles.json"].textures
        this.rocksTextures = PIXI.Loader.shared.resources["client/img/rocks.json"].textures
        this.wallTextures = PIXI.Loader.shared.resources["client/img/valley_walls.json"].textures
    }

    getWidth() {
        return this.width_px
    }

    getHeight() {
        return this.height_px
    }

    constructMap() {
        this.pathTiles.removeChildren()
        this.shadowTiles.removeChildren()
        this.sideWalls.removeChildren()
        this.topWalls.removeChildren()
        this.landTiles.removeChildren()
        this.removeChildren()

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Determine the sprite to used, based on tile type
                let textureName = "land_1.png" // Default to land
                switch(getBoard()[r][c]["value"]) {
                    case 'r':
                    case 'l':
                    case 'u':
                    case 'd':
                        textureName = "track_straight_1.png"
                        break
                    case 'ld':
                    case 'lu':
                    case 'rd':
                    case 'ru':
                    case 'dl':
                    case 'ul':
                    case 'dr':
                    case 'ur':
                        textureName = "track_corner_1.png"
                        break
                    default:
                        break
                }

                var map_square_sprite = new PIXI.Sprite(this.mapTextures[textureName]);
                map_square_sprite.y += r * this.mapSpriteSize
                map_square_sprite.x += c * this.mapSpriteSize
                map_square_sprite.name = "map_" + r.toString() + "_" + c.toString()

                // Randomly add some rocks to path tiles
                if (getBoard()[r][c]["value"] != 'x') {
                    this.pathTiles.addChild(map_square_sprite)
                    let maxRocksPerMapSquare = 4
                    let rocksCount = Math.floor(Math.random() * maxRocksPerMapSquare) // 0 -> 3
                    for (let rockIdx=0; rockIdx < rocksCount; rockIdx += 1) {
                        let rockTexture = getRandomObject(this.rocksTextures)
                        let rockSprite = new PIXI.Sprite(rockTexture)
                        rockSprite.x = Math.floor(Math.random() * (this.mapSpriteSize-rockTexture.width))
                        rockSprite.y = Math.floor(Math.random() * (this.mapSpriteSize-rockTexture.height))
                        map_square_sprite.addChild(rockSprite);
                    }
                } else this.landTiles.addChild(map_square_sprite)

                // Add the wall of the valley. These sprites go on the tiles adjacent to the path, so there is enough room for enemy sprites.
                // Rotate based on direction of the path.
                let direction = getBoard()[r][c]["value"]
                    let midCol = this.cols / 2
                    let shiftX = map_square_sprite.x
                    let shiftY = map_square_sprite.y
                    let scale = Math.max(Math.abs(c - midCol) / (midCol), 0.6) // Scale to show perspective of side walls

                    // Exposed wall at the top of the path sprite
                    if (direction == 'r' || direction == 'l' || direction == 'ur' || direction == 'ld' || direction == 'rd' || direction == 'ul') {
                        let texture = this.wallTextures["valley_wall_1.png"]
                        this.topWalls.addChild(this.generateMapWallSprite(texture, shiftX, shiftY - texture.height/1.5, 1, 1, 0))
                    }

                    // Cliff edge at the bottom of the path sprite
                    if (direction == 'r' || direction == 'l' || direction == 'dr' || direction == 'lu' || direction == 'dl' || direction == 'ru') {
                        let texture = this.wallTextures["valley_wall_lower_1.png"]
                        this.topWalls.addChild(this.generateMapWallSprite(texture, shiftX, shiftY + this.mapSpriteSize - texture.height, 1, 1, 0))
                    }

                    // // Edge at the left of the path sprite
                    if (direction == 'u' || direction == 'd' || direction == 'ur' || direction == 'ld' || direction == 'dr' || direction == 'lu') {
                        if (c <= midCol) {
                            let texture = this.wallTextures["valley_wall_side_2.png"]
                            this.sideWalls.addChild(this.generateMapWallSprite(texture, shiftX + texture.height*scale/2, shiftY, 1, scale, Math.PI/2))
                        } else {
                            let texture = this.wallTextures["valley_wall_lower_1.png"]
                            this.sideWalls.addChild(this.generateMapWallSprite(texture, shiftX + texture.height*scale, shiftY, 1, scale, Math.PI/2))
                        }
                    }

                    // Edge at the right of the path sprite
                    if (direction == 'u' || direction == 'd' || direction == 'ru' || direction == 'dl' || direction == 'rd' || direction == 'ul') {
                        if (c >= midCol) {
                            let texture = this.wallTextures["valley_wall_side_2.png"]
                            this.sideWalls.addChild(this.generateMapWallSprite(texture, shiftX - texture.height*scale/2 + texture.width, shiftY + texture.width, 1, scale, -Math.PI/2))
                        } else {
                            let texture = this.wallTextures["valley_wall_lower_1.png"]
                            this.sideWalls.addChild(this.generateMapWallSprite(texture, shiftX - texture.height*scale + texture.width, shiftY + texture.width, 1, scale, -Math.PI/2))
                        }
                    }
            }
        }
        this.addChild(this.pathTiles)
        this.addChild(this.landTiles)
        this.addChild(this.sideWalls)
        this.addChild(this.topWalls) // TODO find a way to get this over enemy sprites
    }

    generateMapWallSprite(texture, shiftX, shiftY, scaleX, scaleY, rotation) {
        let sprite = new PIXI.Sprite(texture)
        sprite.setTransform(
            shiftX, shiftY, // position
            scaleX, scaleY, // scale
            rotation,       // angle in rad
            0, 0,           // skew
            0, 0            // pivot
        )
        return sprite
    }
}