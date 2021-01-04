import { getBoard } from "../../state.js"
import { BaseComponent } from "./base/baseComponent.js"

function getRandomObject(jsonObject) {
    let randKey = Object.keys(jsonObject)[Math.floor(Math.random() * Object.keys(jsonObject).length)]
    return jsonObject[randKey]
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

        // A texture is a WebGL-ready image
        // Keep things in a texture cache to make rendering fast and efficient
        let mapTextures = PIXI.Loader.shared.resources["client/img/map_tiles.json"].textures
        let rocksTextures = PIXI.Loader.shared.resources["client/img/rocks.json"].textures
        let wallTextures = PIXI.Loader.shared.resources["client/img/valley_walls.json"].textures

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
                        let rockTexture = getRandomObject(rocksTextures)
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
                getBoard()[r][c]["adjacentPathDirs"].forEach((direction) => {
                    let wallTexture = "valley_wall_1.png"
                    let shadowTexture = ""
                    let shadowRotation = 0
                    let shadowShiftX = 0
                    let shadowShiftY = 0
                    let shadowScaleY = 0
                    let shadowScaleX = 0
                    let positionAdjustmentX = 0
                    let positionAdjustmentY = 0
                    let horizontalScale = 1
                    let verticalScale = 1
                    let wallAngleAdjustment = 0
                    let skip = false
                    switch(direction) {
                        case 1: // Wall/path is at top of this tile
                            positionAdjustmentY = -2 // Offset by the height of the texture since it sits on the path TODO make this not a fixed number
                            wallTexture = "valley_wall_lower_1.png"
                            shadowTexture = "valley_floor_shadow_slanted.png"
                            shadowShiftX = -16
                            shadowShiftY = -18
                            break
                        case 3: // Wall/path is at left of this tile
                            wallAngleAdjustment = -Math.PI/2
                            positionAdjustmentY += this.mapSpriteSize
                            shadowTexture = "valley_floor_shadow_slanted.png"
                            shadowRotation = -Math.PI/2
                            shadowShiftY = -16
                            shadowScaleX = -1
                            shadowShiftX = -18
                            if (c > this.cols/2) {
                                wallTexture = "valley_wall_side_2.png"
                                positionAdjustmentX -= 3
                                horizontalScale = Math.min((c-(this.cols/2))/(this.cols/2) + 0.5, 1) // Scale by how close to middle so perspective can change. = 0.2 so that it is not super thin. Max 1 so does not go bigger than possible
                            } else {
                                wallTexture = "valley_wall_lower_1.png"
                                positionAdjustmentX -= 2
                            }
                            break
                        case 4: // Wall/path is at right of this tile
                            wallAngleAdjustment = Math.PI/2
                            positionAdjustmentX += this.mapSpriteSize
                            if (c < this.cols/2) {
                                wallTexture = "valley_wall_side_2.png"
                                positionAdjustmentX += 3
                                horizontalScale = Math.min(1 - c/(this.cols/2) + 0.5, 1)
                            } else {
                                wallTexture = "valley_wall_lower_1.png"
                                positionAdjustmentX += 2
                            }
                            break
                        case 6: // Wall/path is at bottom of this tile
                            wallAngleAdjustment = Math.PI
                            positionAdjustmentY += this.mapSpriteSize
                            positionAdjustmentX += this.mapSpriteSize
                            break
                        default:
                            skip = true
                            break
                    }

                    let wallSprite = new PIXI.Sprite(wallTextures[wallTexture])
                    wallSprite.setTransform(
                        positionAdjustmentX, positionAdjustmentY, // position
                        verticalScale, horizontalScale,           // scale
                        wallAngleAdjustment,                      // angle
                        0, 0,                                     // skew
                        0, 0                                      // pivot
                    )

                    if (shadowTexture != "") {
                        let shadowSprite =  new PIXI.Sprite(wallTextures[shadowTexture])
                        shadowSprite.setTransform(
                            shadowShiftX, shadowShiftY, // position
                            shadowScaleX, shadowScaleY, // scale
                            shadowRotation,             // angle
                            0, 0,                       // skew
                            0, 0                        // pivot
                            )
                        shadowSprite.x += map_square_sprite.x
                        shadowSprite.y += map_square_sprite.y
                        this.shadowTiles.addChild(shadowSprite)
                    }

                    if (!skip) {
                        // Add these sprites to separate containers so that they appear on top of all the other tiles
                        wallSprite.x += map_square_sprite.x
                        wallSprite.y += map_square_sprite.y
                        if (direction == 3 || direction == 4) {
                            this.sideWalls.addChild(wallSprite)
                        } else if (direction == 1 || direction == 6) {
                            this.topWalls.addChild(wallSprite)
                        }
                    }
                })
            }
        }
        this.addChild(this.pathTiles)
        this.shadowTiles.filters=[new PIXI.filters.AlphaFilter(0.4)]; // Set alpha filter for whole container, so that individual shadow alphas so not add together
        this.addChild(this.shadowTiles)
        this.addChild(this.landTiles)
        this.addChild(this.sideWalls)
        this.addChild(this.topWalls) // TODO find a way to get this over enemy sprites
    }
}