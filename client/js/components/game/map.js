import { BaseComponent } from "./base/baseComponent.js"

function getRandomObject(jsonObject) {
    let randKey = Object.keys(jsonObject)[Math.floor(Math.random() * Object.keys(jsonObject).length)]
    return jsonObject[randKey]
}

function randomlyPlaceObjects(textureArray, maxCount, targetContainer, strictlyWithinSquare, xMax, yMax, xOffset, yOffset, angleVariation, sizeVariation, allowZeroObjects) {
    let objectCount = Math.ceil(Math.random() * maxCount)
    if (allowZeroObjects) objectCount -= 1 // Prevents maximum being reached, but means that theres a possibility of 0 objects being added
    for (let objectIdx=0; objectIdx < objectCount; objectIdx += 1) {
        let randomTexture = getRandomObject(textureArray)
        let objectSprite = new PIXI.Sprite(randomTexture)
        let scale = sizeVariation > 0 ? (1 + Math.random() * (sizeVariation - 1)) : 1
        objectSprite.scale.set(scale, scale)
        objectSprite.angle = (angleVariation * Math.random()) * (Math.random() > 0.5 ? 1 : -1)
        objectSprite.x = xOffset + Math.floor(Math.random() * (strictlyWithinSquare ? xMax - objectSprite.width : xMax))
        objectSprite.y = yOffset + Math.floor(Math.random() * (strictlyWithinSquare ? yMax - objectSprite.height : yMax))
        targetContainer.addChild(objectSprite);
    }
}

function distToPoint(a, b, a_target, b_target) {
    let a_diff = a_target - a
    let b_diff = b_target - b
    return Math.sqrt(Math.pow(a_diff, 2) + Math.pow(b_diff, 2))
}

// Returns true if the given row, col combination is within dist squares from the given target row, target col combination
function isNearToPoint(r, c, target_r, target_c, dist) {
  return distToPoint(r, c, target_c, target_r) <= dist
}

export class MapComponent extends BaseComponent {
    constructor(cols, rows, mapSpriteSize, scalingFactor=1) {
        super("map")
        this.mapSpriteSize = mapSpriteSize
        this.scalingFactor = scalingFactor
        this.cols = cols
        this.rows = rows

        this.grid = [[]]  // 2d array that stores the row and column values

        this.width_px = this.mapSpriteSize*this.scalingFactor*this.cols
        this.height_px = this.mapSpriteSize*this.scalingFactor*this.rows
        this.scale.set(scalingFactor)

        this.pathTiles = new PIXI.Container()
        this.sideWalls = new PIXI.Container()
        this.topWalls = new PIXI.Container()
        this.landTiles = new PIXI.Container()
        this.landFeatureTiles = new PIXI.Container()
        this.landDecorations = new PIXI.Container()
        this.baseCamp = new PIXI.Container()

        this.addChild(this.landTiles)
        this.addChild(this.landFeatureTiles)
        this.addChild(this.pathTiles)
        this.addChild(this.sideWalls)
        this.addChild(this.topWalls) // TODO find a way to get this over enemy sprites
        this.addChild(this.landDecorations)
        this.addChild(this.baseCamp)

        // A texture is a WebGL-ready image
        // Keep things in a texture cache to make rendering fast and efficient
        this.mapTextures = PIXI.Loader.shared.resources["client/assets/map/base_tiles/base_tiles.json"].textures
        this.rocksTextures = PIXI.Loader.shared.resources["client/assets/map/path_decorations/path_decorations.json"].textures
        this.wallTextures = PIXI.Loader.shared.resources["client/assets/map/path_sides/path_sides.json"].textures
        this.mapFeaturesTextures = PIXI.Loader.shared.resources["client/assets/map/land_patterns/land_patterns.json"].textures
        this.mapDecorationsTextures = PIXI.Loader.shared.resources["client/assets/map/land_decorations/land_decorations.json"].textures

        // Animated textures
        let flagTextures = PIXI.Loader.shared.resources["client/assets/camp/flag1/flag1.json"].textures
        this.flagFrames = []
        for (const texture of Object.values(flagTextures)) {
            this.flagFrames.push(texture)
        }

        this.towerHash = ""
    }

    getWidth() {
        return this.width_px
    }

    getHeight() {
        return this.height_px
    }

    disableCacheAsBitmap() {
        this.children.forEach((container) => {
            container.cacheAsBitmap = false
        })
    }

    enableCacheAsBitmap() {
        // Cache as bitmap enabled by default
        this.children.forEach((container) => {
            container.cacheAsBitmap = true
        })

        // Some containers have animated sprites, so do not CAB
        this.baseCamp.cacheAsBitmap = false
    }

    constructMap(border=0) {
        this.children.forEach((container) => {
            container.removeChildren()
        })
        this.disableCacheAsBitmap()

        let objectClusterCount = 5
        let objectClusterPoints = []
        for (let ocIdx=0; ocIdx < objectClusterCount; ocIdx += 1) {
            objectClusterPoints.push({
                "r": Math.floor(Math.random() * this.rows),
                "c": Math.floor(Math.random() * this.cols)
            })
        }

        // Add the base camp container
        let baseCampContainer = this.createBaseCampSprite(border)
        baseCampContainer.x = this.cols * this.mapSpriteSize
        baseCampContainer.y = Math.floor(this.rows / 2) * this.mapSpriteSize
        baseCampContainer.doNotCacheAsBitmap = true
        this.baseCamp.addChild(baseCampContainer)


        for (let r = 0 - border; r < this.rows + border; r++) {
            for (let c = 0 - border; c < this.cols + border; c++) {
                // Determine the sprite to used, based on tile type
                let textureName = "land_1.png" // Default to land
                switch(this.getGridValue(r, c)) {
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

                //  Path tiles
                if (this.getGridValue(r, c) != 'x') {
                    // Randomly add some rocks to path tiles
                    this.pathTiles.addChild(map_square_sprite)
                    randomlyPlaceObjects(
                        this.rocksTextures, 4, map_square_sprite, true,
                        this.mapSpriteSize, this.mapSpriteSize,
                        0, 0,
                        0, 1.1,
                        true
                    )

                    // Add the wall of the valley. These sprites go on the tiles adjacent to the path, so there is enough room for enemy sprites.
                    // Rotate based on direction of the path.
                    let direction = this.getGridValue(r, c)
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
                            this.sideWalls.addChild(this.generateMapWallSprite(texture, shiftX + texture.height*scale/1.5, shiftY, 1, scale, Math.PI/2))
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
                } else {
                    this.landTiles.addChild(map_square_sprite)

                    // Add decorations to the land tiles. These decorations could be a cactus, some rocks etc.
                    let addObjectChance = 0.05 // Chance to add a decoration to any land tile
                    let distanceToCluster = 2 // If the land tile is within this number of tiles from a cluster,have a higher chance of adding decoration

                    // Calculate whether this tile is near to a cluster - if so increase the chance of adding a decoration
                    objectClusterPoints.forEach((point) => {
                        if (isNearToPoint(r, c, point.r, point.c, distanceToCluster)) addObjectChance = 0.5
                    })

                    // If RNG chance is met, and not adjacent to the valley path (because may overlap with valley path sprites) or near the camp then add decoration
                    if (Math.random() <= addObjectChance && !this.isNextToPath(c, r, this.cols, this.rows) && !baseCampContainer.getBounds().contains(map_square_sprite.x, map_square_sprite.y)) {
                        randomlyPlaceObjects(
                            this.mapDecorationsTextures, 1, this.landDecorations, false,
                            this.mapSpriteSize, this.mapSpriteSize,
                            map_square_sprite.x, map_square_sprite.y,
                            10, 1.5,
                            false
                        )
                    }
                }

                // Add texture to the land
                // Even path tiles have these added, so that it is not sparse near path tiles. They are rendered under path, so is acceptable.
                randomlyPlaceObjects(
                    this.mapFeaturesTextures, 20, this.landFeatureTiles, false,
                    this.mapSpriteSize, this.mapSpriteSize,
                    map_square_sprite.x, map_square_sprite.y,
                    180, 0,
                    false
                )
            }
        }


        // The map contains a lot of sprites, none of which move
        // As such can set this to cache as a bitmap to save processing
        this.enableCacheAsBitmap()
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

    /**
     * Base camp is the target for the enemies, and the thing the players are protecting
     * It exists at the end of the path
     */
    createBaseCampSprite(border) {
        //    _ /
        // _/
        // _
        //  \ _
        //      \
        let baseCampContainer = new PIXI.Container()

        // Add some camp decorations
        let _this = this
        function addFlagSprite(x, y, startFrame=0, scale=1, angle=0) {
            let flag = new PIXI.AnimatedSprite(_this.flagFrames)
            flag.loop = true
            flag.animationSpeed = 0.3
            flag.gotoAndPlay(startFrame)
            flag.x = x
            flag.y = y
            flag.pivot.set(0.5)
            const angleRange = 30
            flag.angle = angle //20 * (Math.random() > 0.5 ? -1 : 1) //Math.floor(Math.random()*angleRange) - angleRange/2
            flag.scale.set(scale)
            baseCampContainer.addChild(flag)
        }

        for (let col=0; col < border; col++) {
            let rows = 3 + (Math.floor(col / 2) * 2)  // Total number of rows in this column
            let rowsPerSide = Math.floor(rows/2)  // Rows either side of the central path
            for (let row = -rowsPerSide; row <= rowsPerSide; row++) {
                const x_pos = col * this.mapSpriteSize
                const y_pos = row * this.mapSpriteSize
                // Tiles at top and bottom of even numbered columbs are a slant
                let tileType = (Math.abs(row) == rowsPerSide && col % 2 == 0) ? "track_half_1.png" : "track_straight_1.png"
                let floor = new PIXI.Sprite(this.mapTextures[tileType])
                floor.x = x_pos
                floor.y = y_pos

                // Final tile at bottom of even rows must be flipped because it is slanted
                if (row == rowsPerSide && col % 2 == 0) {
                    floor.scale.y = -1
                    floor.y += floor.height
                }
                baseCampContainer.addChild(floor)

                // Add valley sides to the top and bottom
                const isDiagonal = (col%2==0)
                if (row == -rowsPerSide) {
                    let texture = this.wallTextures[isDiagonal ? "valley_wall_diagonal_1.png" : "valley_wall_1.png"]
                    baseCampContainer.addChild(
                        this.generateMapWallSprite(texture,
                            x_pos + (isDiagonal ? -this.mapSpriteSize*0.12 : 0),
                            y_pos - texture.height/1.5 + (isDiagonal ? this.mapSpriteSize*1.1 : 0),
                            1, 1,
                            isDiagonal ? -Math.PI/4 : 0)
                    )
                } else if (row == rowsPerSide) {
                    let texture = this.wallTextures[isDiagonal ? "valley_wall_lower_diagonal_1.png" : "valley_wall_lower_1.png"]
                    baseCampContainer.addChild(
                        this.generateMapWallSprite(texture,
                            x_pos + (isDiagonal ? texture.height / 2 : 0),
                            y_pos - (texture.height / 2) + (isDiagonal ? 0 : this.mapSpriteSize - (texture.height/2)),
                            1, 1,
                            isDiagonal ? Math.PI/4 : 0)
                    )
                }

            }
        }

        // Add two flags at the start of the base
        addFlagSprite(0, -50, 6, 0.9, 20)
        addFlagSprite(0,  50, 0, 0.9, 20)
        return baseCampContainer
    }

    isNextToPath(x, y, xMax, yMax) {
        let nextToPath = false
        for (let col = -1; col <= 1; col += 1) {
            for (let row = -1; row <= 1; row += 1) {
                let colToCheck = x + col
                let rowToCheck = y + row
                if (colToCheck >= 0 && colToCheck < xMax && rowToCheck >= 0 && rowToCheck < yMax) {
                    if (this.getGridValue(rowToCheck, colToCheck) != 'x') {
                        nextToPath = true
                    }
                }
            }
        }
        return nextToPath
    }

    isUnoccupied(row, col) {
        return this.getGridValue(row, col) == 'x'
    }

    getGridValue(r, c) {
        if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) {
            return 'x'
        } else {
            return this.grid[r][c]["value"]
        }
    }

    setGridValues(grid) {
        this.grid = grid
    }

    xy2rc(x, y) {
        // Returns the row and column that the given x y coordinates map to
        return {
            "row": Math.floor(y / this.mapSpriteSize),
            "col": Math.floor(x / this.mapSpriteSize)
        }
    }

    rc2xy(r, c) {
        // Returns the x and y that the given row column square centres map to
        return {
            "x": c * this.mapSpriteSize + this.mapSpriteSize / 2,
            "y": r * this.mapSpriteSize + this.mapSpriteSize / 2
        }
    }

    getNearestNonOccupiedSquare(x, y) {
        // Returns the closest square that is empty i.e. no path, no tower
        let rc = this.xy2rc(x, y)  // Get the row and colum this position maps to
        let closest_rc = rc
        if (!this.isUnoccupied(rc.row, rc.col)) {  // If occupied, start checking, otherwise just return the given position
            let offset = 1
            let found = false
            while (!found) {
                let currentShortestDistance = this.mapSpriteSize * offset * 2  // If any are viable, they will be shorter than this distance
                for (let r = -offset; r <= offset; r++) {
                    for (let c = -offset; c <= offset; c++) {
                        let xy_tester = this.rc2xy(rc.row + r, rc.col + c)
                        // Only do the check if for a square on the outer most check path
                        // Otherwise would be repeating all the squares done in the previous iteration
                        // x x x x x
                        // x y y y x
                        // x y z y x
                        // x y y y x
                        // x x x x x
                        // i.e. if offset is 2, then only check y squares becuase already checked x and z
                        if (Math.abs(r) == offset || Math.abs(c) == offset) {
                            let distance = distToPoint(x, y, xy_tester.x, xy_tester.y)
                            if (this.isUnoccupied(rc.row + r, rc.col + c) && distance < currentShortestDistance) {  // A viable space, check the distance
                                found = true  // At least one of the squares at this distance is viable
                                closest_rc = this.xy2rc(xy_tester.x, xy_tester.y)
                                currentShortestDistance = distance
                            }
                        }
                    }
                }
                offset += 1  // Try squares further away if one not found at current distance
            }
        }
        return closest_rc
    }

    update(towerUpdate) {
        if (this.towerHash != towerUpdate.hash) {
            // A change in the number of towers i.e. new tower placed
            towerUpdate.objects.forEach((tower) => {
                // Check if any towers and map object occupy the same space. If they do, remove the object so it looks like the space has been cleared for the tower. Loks weird if tower is just on top.
                for (let idx = this.landDecorations.children.length-1 ; idx >= 0; idx -= 1) {
                    let decoration = this.landDecorations.children[idx]
                    let decCol = Math.floor(decoration.x / this.mapSpriteSize)
                    let decRow = Math.floor(decoration.y / this.mapSpriteSize)
                    if (decCol == tower.position.col && decRow == tower.position.row) {
                        this.landDecorations.cacheAsBitmap = false
                        this.landDecorations.removeChild(decoration)
                        this.landDecorations.cacheAsBitmap = true
                        break // Can do this since one object per square
                    }
                }
            })

        }
        this.towerHash = towerUpdate.hash

    }
}