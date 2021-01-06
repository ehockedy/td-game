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

                var map_square_sprite = new PIXI.Sprite(this.mapTextures[textureName]);
                map_square_sprite.y += r * this.mapSpriteSize
                map_square_sprite.x += c * this.mapSpriteSize
                map_square_sprite.name = "map_" + r.toString() + "_" + c.toString()

                if (angleAdjustment) {
                    // Set the pivot point, then adjust offset
                    map_square_sprite.pivot.set(this.mapSpriteSize/2, this.mapSpriteSize/2)
                    map_square_sprite.x += this.mapSpriteSize/2
                    map_square_sprite.y += this.mapSpriteSize/2
                    map_square_sprite.angle += angleAdjustment
                }

                if (getBoard()[r][c]["value"] == 0) {
                    this.landTiles.addChild(map_square_sprite)
                } else {
                    this.pathTiles.addChild(map_square_sprite)
                }

                // Randomly add some rocks to path tiles
                if (getBoard()[r][c]["value"] != 0) {
                    let maxRocksPerMapSquare = 4
                    let rocksCount = Math.floor(Math.random() * maxRocksPerMapSquare) // 0 -> 3
                    for (let rockIdx=0; rockIdx < rocksCount; rockIdx += 1) {
                        let rockTexture = getRandomObject(this.rocksTextures)
                        let rockSprite = new PIXI.Sprite(rockTexture)
                        rockSprite.x = Math.floor(Math.random() * (this.mapSpriteSize-rockTexture.width))
                        rockSprite.y = Math.floor(Math.random() * (this.mapSpriteSize-rockTexture.height))
                        if (angleAdjustment) {
                            rockSprite.pivot.set(rockTexture.width/2, rockTexture.height/2)
                            rockSprite.x += rockTexture.width/2
                            rockSprite.y += rockTexture.height/2
                            rockSprite.angle -= angleAdjustment // Undo the rotation given to the path tile, so all shadows face the same way
                        }
                        map_square_sprite.addChild(rockSprite);
                    }
                }

                // Add the wall of the valley. These sprites go on the tiles adjacent to the path, so there is enough room for enemy sprites.
                // Rotate based on direction of the path relative to tile.
                // 0  1  2
                // 3     4
                // 5  6  7
                let adjacentPathDirs = getBoard()[r][c]["adjacentPathDirs"]
                for (let i=0; i < adjacentPathDirs.length; i++) {
                    let direction = adjacentPathDirs[i]
                    let midCol = this.cols / 2

                    // Get the sprite based on the direction of the path relative to the current tile
                    let sprite
                    if (direction == PATH_DIRECTIONS.BOTTOM) {
                        sprite = this.getBackWall(direction)
                        this.topWalls.addChild(sprite)
                    } else if (direction == PATH_DIRECTIONS.TOP) {
                        sprite = this.getOverhangWall(direction)
                        this.topWalls.addChild(sprite)
                    } else if ((direction == PATH_DIRECTIONS.LEFT && c > midCol) ||
                               (direction == PATH_DIRECTIONS.RIGHT && c < midCol)) {
                        sprite = this.getExposedSideWall(direction)
                        sprite.scale.y = Math.max(Math.abs(c - midCol) / (midCol), 0.6) // Scale to show perspective
                        this.sideWalls.addChild(sprite)
                    } else if ((direction == PATH_DIRECTIONS.LEFT && c <= midCol) ||
                               (direction == PATH_DIRECTIONS.RIGHT && c >= midCol)) {
                        sprite = this.getUnexposedSideWall(direction)
                        this.sideWalls.addChild(sprite)
                    } else {
                        continue // sprite not needed, so skip
                    }

                    // Shift because transformations are local
                    sprite.x += map_square_sprite.x
                    sprite.y += map_square_sprite.y

                    // Some directions will cast a shadow
                    if (direction == PATH_DIRECTIONS.LEFT || direction == PATH_DIRECTIONS.TOP) {
                        let shadow = this.getShadow(direction)
                        shadow.x += map_square_sprite.x
                        shadow.y += map_square_sprite.y
                        this.shadowTiles.addChild(shadow)
                    }
                }
            }
        }
        this.addChild(this.pathTiles)
        this.shadowTiles.filters=[new PIXI.filters.AlphaFilter(0.4)]; // Set alpha filter for whole container, so that individual shadow alphas so not add together
        this.addChild(this.shadowTiles)
        this.addChild(this.landTiles)
        this.addChild(this.sideWalls)
        this.addChild(this.topWalls) // TODO find a way to get this over enemy sprites
    }

    // Return a shadow based on path direction
    // Set the sprite to use
    getShadow(pathDirection) {
        let textureImageName = "valley_floor_shadow_slanted.png"
        let texture = this.wallTextures[textureImageName]
        return this._makeMapSprite(texture, (transformationObj) => {return this._shadowSwitch(pathDirection, texture, transformationObj)})
    }

    getExposedSideWall(pathDirection) {
        let textureImageName = "valley_wall_side_2.png"
        let texture = this.wallTextures[textureImageName]
        return this._makeMapSprite(texture, (transformationObj)=>{return this._wallSwitch(pathDirection, 3, transformationObj)})
    }

    getUnexposedSideWall(pathDirection) {
        let textureImageName = "valley_wall_lower_1.png"
        let texture = this.wallTextures[textureImageName]
        return this._makeMapSprite(texture, (transformationObj)=>{return this._wallSwitch(pathDirection, 2, transformationObj)})
    }

    getBackWall(pathDirection) {
        let textureImageName = "valley_wall_1.png"
        let texture = this.wallTextures[textureImageName]
        return this._makeMapSprite(texture, (transformationObj)=>{return this._backWallSwitch(pathDirection, transformationObj)})
    }

    getOverhangWall(pathDirection) {
        let textureImageName = "valley_wall_lower_1.png"
        let texture = this.wallTextures[textureImageName]
        return this._makeMapSprite(texture, (transformationObj)=>{return this._overhangWallSwitch(pathDirection, transformationObj)})
    }

    // ~~~~~ Switch functions ~~~~~
    // Given a path direction, determines the transformations required to get sprite into the right place
    // Returns true if transformations set, returns false if this sprite is not required

    // Set the transformations required to set a shadow on the path
    // A shadow sprite is only required in the case where the path is above or left of the path (since sun is coming from bottom right)
    _shadowSwitch(pathDirection, texture, transformationObj) {
        let isSpriteRequired = true
        let shiftOffset = 16 // This is the amount that the sprite should be shifted so that it appeard off center due to the sun. Ideally would include it in the sprite json
        switch(pathDirection) {
            case PATH_DIRECTIONS.TOP:
                transformationObj.shiftX = -shiftOffset // Move left so appears left because sun is right
                transformationObj.shiftY = -texture.height // Move it up so it appears behind the wall
                break
            case PATH_DIRECTIONS.LEFT:
                transformationObj.rotation = -Math.PI/2 // Rotate so it same direction as the wall, and wall grooves are visible
                transformationObj.shiftY = -shiftOffset // Shift so that
                transformationObj.scaleX = -1 // Rotate in X axis
                transformationObj.shiftX = -texture.height
                break
            default:
                isSpriteRequired = false
                break
        }
        return isSpriteRequired
    }

    _wallSwitch(pathDirection, shiftOffset, transformationObj) {
        let isSpriteRequired = true
        switch(pathDirection) {
            case PATH_DIRECTIONS.RIGHT:
                transformationObj.rotation = Math.PI/2
                transformationObj.shiftX += this.mapSpriteSize
                transformationObj.shiftX += shiftOffset
                break
            case PATH_DIRECTIONS.LEFT:
                transformationObj.rotation = -Math.PI/2
                transformationObj.shiftY += this.mapSpriteSize
                transformationObj.shiftX += -shiftOffset
                break
            default:
                isSpriteRequired = false
                break
        }
        return isSpriteRequired
    }

    _backWallSwitch(pathDirection, transformationObj) {
        let isSpriteRequired = true
        switch(pathDirection) {
            case PATH_DIRECTIONS.BOTTOM:
                transformationObj.rotation = Math.PI
                transformationObj.shiftY += this.mapSpriteSize
                transformationObj.shiftX += this.mapSpriteSize
                break
            default:
                isSpriteRequired = false
                break
        }
        return isSpriteRequired
    }

    _overhangWallSwitch(pathDirection, transformationObj) {
        let isSpriteRequired = true
        switch(pathDirection) {
            case PATH_DIRECTIONS.TOP:
                transformationObj.shiftY -= 2
                break
            default:
                isSpriteRequired = false
                break
        }
        return isSpriteRequired
    }

    // Generic make sprite function that, given a texture and transformation setting function, makes a sprite if one is required
    _makeMapSprite(texture, switchFn) {
        let transformationObj = {
            rotation: 0,
            shiftX: 0,
            shiftY: 0,
            scaleX: 0,
            scaleY: 0
        }

        let sprite
        let isSpriteRequired = switchFn(transformationObj)
        if (isSpriteRequired) {
            sprite = new PIXI.Sprite(texture)
            sprite.setTransform(
                transformationObj.shiftX, transformationObj.shiftY, // position
                transformationObj.scaleX, transformationObj.scaleY, // scale
                transformationObj.rotation,                         // angle in rad
                0, 0,                                               // skew
                0, 0                                                // pivot
            )
        }
        return sprite //{ "required": isSpriteRequired, "sprite": sprite }
    }
}