import { BaseComponent } from "./base/baseComponent.js"

function getRandomObject(jsonObject) {
    let randKey = Object.keys(jsonObject)[Math.floor(Math.random() * Object.keys(jsonObject).length)]
    return jsonObject[randKey]
}

function randomlyPlaceObjects(textureArray, maxCount, targetContainer, strictlyWithinSquare, xMax, yMax, xOffset, yOffset, angleVariation, sizeVariation, allowZeroObjects, central) {
    let objectCount = Math.ceil(Math.random() * maxCount)
    if (allowZeroObjects) objectCount -= 1 // Prevents maximum being reached, but means that theres a possibility of 0 objects being added
    for (let objectIdx=0; objectIdx < objectCount; objectIdx += 1) {
        let randomTexture = getRandomObject(textureArray)
        let objectSprite = new PIXI.Sprite(randomTexture)
        let scale = sizeVariation > 0 ? (1 + Math.random() * (sizeVariation - 1)) : 1
        objectSprite.scale.set(scale, scale)
        objectSprite.angle = (angleVariation * Math.random()) * (Math.random() > 0.5 ? 1 : -1)
        if (central) {
            objectSprite.anchor.set(0.5)
            objectSprite.x = (xOffset + xMax) / 2
            objectSprite.y = (yOffset + yMax) / 2

        } else {
            objectSprite.x = xOffset + Math.floor(Math.random() * (strictlyWithinSquare ? xMax - objectSprite.width : xMax))
            objectSprite.y = yOffset + Math.floor(Math.random() * (strictlyWithinSquare ? yMax - objectSprite.height : yMax))
        }
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
    constructor(mapSpriteSize) {
        super("map")
        this.mapSpriteSize = mapSpriteSize

        this.width_px = 0 //this.mapSpriteSize*this.scalingFactor*this.cols
        this.height_px = 0 //this.mapSpriteSize*this.scalingFactor*this.rows
        //this.scale.set(scalingFactor)  // TODO set this in construct
        this.mapStructure = [[]]
        this.rows = 0
        this.cols = 0

        this.mapSpriteGrid = []

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
        this.mapFeaturesTextures = PIXI.Loader.shared.resources["client/assets/map/land_patterns/land_patterns.json"].textures
        this.mapDecorationsTextures = PIXI.Loader.shared.resources["client/assets/map/land_decorations/land_decorations.json"].textures
        this.campDecorationTextures = PIXI.Loader.shared.resources["client/assets/camp/tents/tents.json"].textures

        // Parse wall textures using filenames
        let wt = PIXI.Loader.shared.resources["client/assets/map/path_sides/path_sides.json"].textures
        this.wallTextures = {
            "exposed": {
                "diagonal": [],
                "horizontal": []
            },
            "hidden": {
                "diagonal": [],
                "horizontal": []
            },
        }
        for (const [key, value] of Object.entries(wt)) {
            let nameSplit = key.split('/')
            this.wallTextures[nameSplit[0]][nameSplit[1]].push(value)
            // todo error checking
        }

        // Animated textures
        let flagTextures = PIXI.Loader.shared.resources["client/assets/camp/flag1/flag1.json"].textures
        this.flagFrames = []
        for (const texture of Object.values(flagTextures)) {
            this.flagFrames.push(texture)
        }

        let tent1Textures = PIXI.Loader.shared.resources["client/assets/camp/tents/tent1.json"].textures
        this.tent1Frames = []
        for (const texture of Object.values(tent1Textures)) {
            this.tent1Frames.push(texture)
        }
        let tent2Textures = PIXI.Loader.shared.resources["client/assets/camp/tents/tent2.json"].textures
        this.tent2Frames = []
        for (const texture of Object.values(tent2Textures)) {
            this.tent2Frames.push(texture)
        }

        this.towerHash = ""
    }

    setRowsAndCols(rows, cols) {
        this.rows = rows
        this.cols = cols
    }

    getWidth() {
        return this.width_px
    }

    getHeight() {
        return this.height_px
    }

    _getRandomWallTexture(type, isDiagonal) {
        let arr = this.wallTextures[type][isDiagonal ? "diagonal" : "horizontal"]
        return arr[Math.floor(Math.random() * arr.length)]
        // TODO error checking
    }

    getRandomExposedWallTexture(isDiagonal=false) {
        return this._getRandomWallTexture("exposed", isDiagonal)
    }

    getRandomHiddenWallTexture(isDiagonal=false) {
        return this._getRandomWallTexture("hidden", isDiagonal)
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

    createLandTile(addDecoration, isNextToPath=false) {
        let tileContainer = new PIXI.Container()
        let textureName = "land_1.png"
        tileContainer.addChild(new PIXI.Sprite(this.mapTextures[textureName]))
        randomlyPlaceObjects(
            this.mapFeaturesTextures, 1, tileContainer, false,
            0, 0,
            0, 0,
            0, 0,
            false, false
        )
        if (addDecoration) {
            randomlyPlaceObjects(
                this.mapDecorationsTextures, 1, tileContainer, true,
                this.mapSpriteSize, this.mapSpriteSize,
                0, 0,
                10, 1.2,
                false, isNextToPath
            )
        } 
        tileContainer.hasDecoration = addDecoration
        return tileContainer
    }

    constructMap(mapStructure, includeBase=false, scaleFactor=1, border=0) {
        this.mapStructure = mapStructure
        this.rows = mapStructure.length
        this.cols = mapStructure[0].length

        // TODO make set as Bitmap external function to call
        this.children.forEach((container) => {
            container.removeChildren()
        })
        this.disableCacheAsBitmap()

        let objectClusterCount = 4
        let objectClusterPoints = []
        for (let ocIdx=0; ocIdx < objectClusterCount; ocIdx += 1) {
            objectClusterPoints.push({
                "r": Math.floor(Math.random() * this.rows),
                "c": Math.floor(Math.random() * this.cols)
            })
        }

        // Add the base camp container, if configured to do so.
        if (includeBase) {
            let baseCampContainer = this.createBaseCampSprite(border)
            baseCampContainer.x = this.cols * this.mapSpriteSize

            let finalRow
            for (let r = 0; r < this.rows; r++) {
                if (this.getGridValue(mapStructure, r, this.cols-1) == 'r') {
                    // Have find the final row - only one path sprite present and it's a right tile
                    finalRow = r
                    break
                }
            }

            baseCampContainer.y = finalRow * this.mapSpriteSize
            baseCampContainer.doNotCacheAsBitmap = true
            this.baseCamp.addChild(baseCampContainer)
        }


        for (let r = 0 - border; r < this.rows + border; r++) {
            this.mapSpriteGrid.push([])  // Start a new row
            for (let c = 0 - border; c < this.cols + border; c++) {
                const gridValue = this.getGridValue(mapStructure, r, c)
                if (gridValue == 'x') {
                    let addObjectChance = 0.01 // Chance to add a decoration to any land tile

                    // Calculate whether this tile is near to a cluster - if so increase the chance of adding a decoration
                    objectClusterPoints.forEach((point) => {
                        // If the land tile is within this number of tiles from a cluster, have a higher chance of adding decoration
                        if (isNearToPoint(r, c, point.r, point.c, 1)) addObjectChance = 1
                        if (isNearToPoint(r, c, point.r, point.c, 2)) addObjectChance = 0.6
                        if (isNearToPoint(r, c, point.r, point.c, 3)) addObjectChance = 0.2
                    })

                    let landTile = this.createLandTile(Math.random() < addObjectChance, this.isNextToPath(mapStructure, c, r, this.cols, this.rows))
                    landTile.x = c * this.mapSpriteSize
                    landTile.y = r * this.mapSpriteSize
                    this.landTiles.addChild(landTile)

                    // Add sprite to the end of the new row
                    this.mapSpriteGrid[this.mapSpriteGrid.length - 1].push(landTile)
                    continue;
                }
                // Determine the sprite to used, based on tile type
                let textureName = "land_1.png" // Default to land
                switch(this.getGridValue(mapStructure, r, c)) {
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
                if (this.getGridValue(mapStructure, r, c) != 'x') {
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
                    let direction = this.getGridValue(mapStructure, r, c)
                    let midCol = this.cols / 2
                    let shiftX = map_square_sprite.x
                    let shiftY = map_square_sprite.y
                    let minimumScale = 0.6
                    let scale = minimumScale + (1-minimumScale) * (Math.abs(c - midCol) / (midCol)) // Scale to show perspective of side walls

                    // Exposed wall at the top of the path sprite
                    if (direction == 'r' || direction == 'l' || direction == 'ur' || direction == 'ld' || direction == 'rd' || direction == 'ul') {
                        let texture = this.getRandomExposedWallTexture()
                        this.topWalls.addChild(this.generateMapWallSprite(texture, shiftX, shiftY, 1, 1, 0))
                    }

                    // Cliff edge at the bottom of the path sprite
                    if (direction == 'r' || direction == 'l' || direction == 'dr' || direction == 'lu' || direction == 'dl' || direction == 'ru') {
                        let texture = this.getRandomHiddenWallTexture()
                        this.topWalls.addChild(this.generateMapWallSprite(texture, shiftX, shiftY + this.mapSpriteSize, 1, 1, 0))
                    }

                    // Edge at the left of the path sprite
                    if (direction == 'u' || direction == 'd' || direction == 'ur' || direction == 'ld' || direction == 'dr' || direction == 'lu') {
                        if (c <= midCol) {
                            let texture = this.getRandomExposedWallTexture()
                            this.sideWalls.addChild(this.generateMapWallSprite(texture, shiftX, shiftY, 1, scale, Math.PI/2))
                        } else {
                            let texture = this.getRandomHiddenWallTexture()
                            this.sideWalls.addChild(this.generateMapWallSprite(texture, shiftX, shiftY, 1, scale, Math.PI/2))
                        }
                    }

                    // Edge at the right of the path sprite
                    if (direction == 'u' || direction == 'd' || direction == 'ru' || direction == 'dl' || direction == 'rd' || direction == 'ul') {
                        if (c >= midCol) {
                            let texture = this.getRandomExposedWallTexture()
                            this.sideWalls.addChild(this.generateMapWallSprite(texture, shiftX + this.mapSpriteSize, shiftY + this.mapSpriteSize, 1, scale, -Math.PI/2))
                        } else {
                            let texture = this.getRandomHiddenWallTexture()
                            this.sideWalls.addChild(this.generateMapWallSprite(texture, shiftX + this.mapSpriteSize, shiftY + this.mapSpriteSize, 1, scale, -Math.PI/2))
                        }
                    }
                }
            }
        }

        // The map contains a lot of sprites, none of which move
        // As such can set this to cache as a bitmap to save processing
        // this.enableCacheAsBitmap()
    }

    generateMapWallSprite(texture, shiftX, shiftY, scaleX, scaleY, rotation) {
        let sprite = new PIXI.Sprite(texture)
        sprite.anchor.set(0, 0.5)
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
            flag.angle = angle
            flag.scale.set(scale)
            baseCampContainer.addChild(flag)
        }

        for (let col=0; col < border; col++) {
            let rows = 3 + (Math.floor(col / 2) * 2)  // Total number of rows in this column
            let rowsPerSide = Math.floor(rows/2)  // Rows either side of the central path
            for (let row = -rowsPerSide; row <= rowsPerSide; row++) {
                const x_pos = col * this.mapSpriteSize
                const y_pos = row * this.mapSpriteSize
                const isDiagonal = (col % 2 ==0)

                // Tiles at top and bottom of even numbered columbs are a slant
                let tileType = (Math.abs(row) == rowsPerSide && isDiagonal) ? "track_half_1.png" : "track_straight_1.png"
                let floor = new PIXI.Sprite(this.mapTextures[tileType])
                floor.x = x_pos
                floor.y = y_pos

                // Final tile at bottom of even rows must be flipped because it is slanted
                if (row == rowsPerSide && isDiagonal) {
                    floor.scale.y = -1
                    floor.y += floor.height
                }
                baseCampContainer.addChild(floor)

                // Add valley sides to the top and bottom
                if (row == -rowsPerSide) {
                    let texture = this.getRandomExposedWallTexture(true)
                    baseCampContainer.addChild(
                        this.generateMapWallSprite(texture,
                            x_pos,
                            y_pos + (isDiagonal ? this.mapSpriteSize : 0),
                            1, 1,
                            isDiagonal ? -Math.PI/4 : 0)
                    )
                } else if (row == rowsPerSide) {
                    let texture =  this.getRandomHiddenWallTexture(true)
                    baseCampContainer.addChild(
                        this.generateMapWallSprite(texture,
                            x_pos,
                            y_pos + (isDiagonal ? 0 : this.mapSpriteSize),
                            1, 1,
                            isDiagonal ? Math.PI/4 : 0)
                    )
                }

            }
        }

        // Add two flags at the start of the base
        addFlagSprite(0, -50, 6, 0.9, 20)
        addFlagSprite(0,  50, 0, 0.9, 20)

        // Add the contents of the camp - tents with towers being built
        let tent1 = new PIXI.AnimatedSprite(this.tent1Frames)
        tent1.position = new PIXI.Point(64, -54)
        tent1.angle = 10
        tent1.loop = true
        tent1.animationSpeed = 0.21
        tent1.play()
        baseCampContainer.addChild(tent1)

        let tent2 = new PIXI.AnimatedSprite(this.tent2Frames)
        tent2.position = new PIXI.Point(60, 70)
        tent2.angle = -3
        tent2.loop = true
        tent2.animationSpeed = 0.19  // Different to other animated sprite so they get out of sync so avoids repetition
        tent2.play()
        baseCampContainer.addChild(tent2)

        let tent3 = new PIXI.Sprite(this.campDecorationTextures["tent3.png"])
        tent3.position = new PIXI.Point(150, 90)
        tent3.angle = 10
        baseCampContainer.addChild(tent3)

        let tent2_2 = new PIXI.Sprite(this.campDecorationTextures["tent2.png"])
        tent2_2.position = new PIXI.Point(140, -65)
        tent2_2.angle = -40
        baseCampContainer.addChild(tent2_2)

        return baseCampContainer
    }

    isNextToPath(mapStructure, x, y, xMax, yMax) {
        let nextToPath = false
        for (let col = -1; col <= 1; col += 1) {
            for (let row = -1; row <= 1; row += 1) {
                let colToCheck = x + col
                let rowToCheck = y + row
                if (colToCheck >= 0 && colToCheck < xMax && rowToCheck >= 0 && rowToCheck < yMax) {
                    if (this.getGridValue(mapStructure, rowToCheck, colToCheck) != 'x') {
                        nextToPath = true
                    }
                }
            }
        }
        return nextToPath
    }

    getGridValue(mapStructure, r, c) {
        if (r < 0 || c < 0 || r >= mapStructure.length || c >= mapStructure[0].length) return 'x'
        return mapStructure[r][c]["value"]
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

    isUnoccupied(row, col) {
        return this.getGridValue(this.mapStructure, row, col) == 'x'
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

    updateMapStructure(mapStructure) {
        this.mapStructure = mapStructure
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

    getDecorationChance(adjacentDecorations) {
        const baseAddDecorationChance = 0.01
        const fadeClusterOutDecorationChance = 0.1
        const clusterAddDecorationChance = 0.3
        if (adjacentDecorations == 1 || adjacentDecorations == 2) return clusterAddDecorationChance
        else if (adjacentDecorations == 3) return fadeClusterOutDecorationChance
        return baseAddDecorationChance

    }

    addRow() {
        const newRow = []
        this.mapSpriteGrid[this.mapSpriteGrid.length - 1].forEach((tile, idx) => {  // Iterate over everything in the previously last row
            // Decide whether to add a decoration based off nearby decorations. We want them to cluster so they look more natural.
            // As such, if there was a decoration in any of the (up to) three directly preceeding squares, then have an increased chance
            // to add one.
            // let decorationChance = baseAddDecorationChance
            let adjacentDecorations = 0
            for (let i = Math.max(idx-1, 0); i <= Math.min(idx+1, this.mapSpriteGrid[this.mapSpriteGrid.length - 1].length-1); i++) {
                if (this.mapSpriteGrid[this.mapSpriteGrid.length - 1][i].hasDecoration) {
                    // decorationChance = clusterAddDecorationChance
                    adjacentDecorations++
                }
            }
            const decorationChance = this.getDecorationChance(adjacentDecorations);
            // if (adjacentDecorations == 1 || adjacentDecorations == 2) decorationChance = clusterAddDecorationChance
            // else if (adjacentDecorations == 3) decorationChance = fadeClusterOutDecorationChance

            // Add new tile directly under the one this is based off
            let newTile = this.createLandTile(Math.random() < decorationChance)
            newTile.x = tile.x
            newTile.y = tile.y + this.mapSpriteSize
            newRow.push(newTile)
            this.landTiles.addChild(newTile)
        })
        this.mapSpriteGrid.push(newRow)
    }

    addCol() {
        // Add new tile at the end of each row
        this.mapSpriteGrid.forEach((row, idx) => {
            const tile = row[row.length - 1]
            // let decorationChance = baseAddDecorationChance
            let adjacentDecorations=0
            for (let i = Math.max(idx-1, 0); i <= Math.min(idx+1, this.mapSpriteGrid.length-1); i++) {
                if (this.mapSpriteGrid[i][this.mapSpriteGrid[i].length - 1].hasDecoration) {
                    // decorationChance = clusterAddDecorationChance
                    adjacentDecorations++
                }
            }
            // if (adjacentDecorations == 1 || adjacentDecorations == 2) decorationChance = clusterAddDecorationChance
            // else if (adjacentDecorations == 3) decorationChance = fadeClusterOutDecorationChance
            const decorationChance = this.getDecorationChance()

            let newTile = this.createLandTile(Math.random() < decorationChance)
            newTile.x = tile.x + this.mapSpriteSize
            newTile.y = tile.y
            row.push(newTile)
            this.landTiles.addChild(newTile)
        })
    }

    tick() {
        // The tick for the map makes the land tiles move to the north east direction. This is used by
        // the main menu. Ideally would have some other specific tick for this, but until it requires another
        // tick can just leave it as it.
        // It works by checking if the top and left most row/column have disappeared from view. If they have,
        // then remove all the tiles in those arrays. Then, add tiles on the opposite side of the screen to give
        // the illusion of a continuous map
        // To avoid checking every child in land tiles, references to the sprites are kept in a 2d array which
        // represents their positions the map.

        const speed = 0.5
        this.landTiles.children.forEach((tile) => {
            tile.x -= speed
            tile.y -= speed
        })

        if (this.mapSpriteGrid.length == 0 || this.mapSpriteGrid[0].length == 0) {
            return;
        }

        const rowsColsChanged = this.rows !== this.mapSpriteGrid.length || this.cols !== this.mapSpriteGrid[0].length
        const topRowOutOfView = this.mapSpriteGrid[0][0].y <= -this.mapSpriteSize
        if (topRowOutOfView || rowsColsChanged) {
            if (topRowOutOfView) {
                            // Remove everything from the row
                let removed = this.mapSpriteGrid.splice(0, 1)
                removed.forEach((row) => {
                    row.forEach((tile) => {
                        this.landTiles.removeChild(tile)
                    })
                })
            }

            // Add rows until screen is filled
            for (let rowCount = this.mapSpriteGrid.length; rowCount < this.rows; rowCount+=1) {
                this.addRow() // Insert the new row at the end of the existing rows
            }

        }

        const leftColOutOfView = this.mapSpriteGrid.length > 0 && this.mapSpriteGrid[0][0].x <= -this.mapSpriteSize
        if (leftColOutOfView || rowsColsChanged) {
            if (leftColOutOfView) {
                // Remove everything from the column
                this.mapSpriteGrid.forEach((row) => {
                    let removed = row.splice(0, 1)
                    removed.forEach((tile) => {
                        this.landTiles.removeChild(tile)
                    })
                })
            }
            for (let colCount = this.mapSpriteGrid[0].length; colCount < this.cols; colCount+=1) {
                this.addCol() // Insert the new row at the end of the existing rows
            }
        }
    }
}