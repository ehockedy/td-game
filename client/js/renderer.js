import { getState, getBoard, getGridDimsRowsCols, getSubGridDim, getGameID } from "./state.js"
import { MSG_TYPES, sendMessage } from "./networking.js"
import { randomHexString } from "./tools.js"

const DEFAULT_SPRITE_SIZE_X = 32 // Width of a sprite in the map spritesheet
const DEFAULT_SPRITE_SIZE_Y = 32 // Height of a sprite in the map spritesheet

let MAP_WIDTH;
let MAP_HEIGHT;
let SUBGRID_SIZE;

let APP_WIDTH;
let APP_HEIGHT;

// PIXI application
let app;

// Sprite containers
let mapContainer = new PIXI.Container(); // The grid all the action takes place in
let toolbarContainer = new PIXI.Container(); // Tower menu background, player stats background, etc.
let towerToolbarContentContainer = new PIXI.Container(); // Info about the tower
let enemyContainer = new PIXI.Container(); // All the enemies on the map
let towerMenuContainer = new PIXI.Container(); // Interactive tower sprites in the tower menu
let towerDataContainer = new PIXI.Container(); // Range of tower etc.
let towerContainer = new PIXI.Container(); // All the towers on the map
let bulletContainer = new PIXI.Container(); // All the bullets on the map

// The element currently clicked/active
let activeClickable

// PIXI graphics
let graphics = new PIXI.Graphics();

// Spritesheet data
let enemySpriteSheet = {};
let towerSpriteSheet = {};
let bulletSpriteSheet = {};

// TODO make these general use function to generate animated sprite sheet data
function generateRedEnemySpritesheetData() {
    let texture = PIXI.Loader.shared.resources["client/img/enemy_spritesheet.png"].texture
    enemySpriteSheet["red"] = []
    for (let i = 0; i < 6; ++i) {
        enemySpriteSheet["red"].push(new PIXI.Texture(texture, new PIXI.Rectangle(0, i * DEFAULT_SPRITE_SIZE_Y, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y)))
    }
}

function generateTowerSpritesheetData() {
    let texture = PIXI.Loader.shared.resources["client/img/tower_spritesheet.png"].texture
    for (let type in towerJson) {
        towerSpriteSheet[type] = []
        towerSpriteSheet[type].push(new PIXI.Texture(texture, new PIXI.Rectangle(0, DEFAULT_SPRITE_SIZE_Y*towerJson[type]["spriteSheetNum"], DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y)))
    }
}

function generateBulletSpritesheetData() {
    let texture = PIXI.Loader.shared.resources["client/img/bullet_spritesheet.png"].texture
    bulletSpriteSheet["simple"] = []
    bulletSpriteSheet["simple"].push(new PIXI.Texture(texture, new PIXI.Rectangle(0, 0, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y)))
}

let identityMatrix = new PIXI.filters.ColorMatrixFilter();
let lightenMatrix = new PIXI.filters.ColorMatrixFilter();
lightenMatrix.matrix = [
    2, 0, 0, 0, 0,
    0, 2, 0, 0, 0,
    0, 0, 2, 0, 0,
    0, 0, 0, 1, 0
]
// lightenMatrix.greyscale(0.5)
//lightenMatrix.alpha = 0.5

// Tower JSON
let towerJson
$.getJSON("shared/json/towers.json", function (data) {
    towerJson = data
})

// Unique colour code for the user TODO let them pick
let randomColourCode = "0x" + randomHexString(6);
let toolbarColourCode = "0x727272"

// Random user name TODO let them pick
let username = randomHexString(6)

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Sprite creators
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * Add enemy with stats based off the type
 * @param {String} name Unique name of the enemy object
 * @param {Number} type Type of enemy
 */
function addEnemy(name, type) {
    // TODO have different types
    let animatedEnemySprite = new PIXI.AnimatedSprite(enemySpriteSheet["red"])
    animatedEnemySprite.loop = true
    animatedEnemySprite.anchor.set(0.5)
    animatedEnemySprite.animationSpeed = 0.2
    animatedEnemySprite.play()
    animatedEnemySprite.name = name // Unique identifier
    animatedEnemySprite.tintCount = 0
    enemyContainer.addChild(animatedEnemySprite)
}

function getTowerSprite(type) {
    let towerSprite = new PIXI.AnimatedSprite(towerSpriteSheet[type])
    towerSprite.loop = false
    towerSprite.anchor.set(0.5)
    towerSprite.type = type
    towerSprite.tint = randomColourCode
    return towerSprite
}

function generateTowerRange(range) {
    // Add the area circle sprite too
    graphics.beginFill("0xe74c3c") // Red
    graphics.alpha = 0.5
    graphics.drawCircle(0, 0, range*DEFAULT_SPRITE_SIZE_Y) // position 0, 0 of the graphics canvas

    let circleTexture = app.renderer.generateTexture(graphics)
    let circleSprite = new PIXI.Sprite(circleTexture) // create a sprite from graphics canvas

    circleSprite.anchor.set(0.5)
    circleSprite.visible = true
    graphics.clear()
    return circleSprite
}

/**
 * Add tower with stats based off the type
 * @param {String} name Unique name of the tower object
 * @param {Number} type Type of tower
 */
function addTower(name, type, owner, row, col) {
    let towerSprite = new PIXI.AnimatedSprite(towerSpriteSheet[type])
    towerSprite.loop = false
    towerSprite.anchor.set(0.5)
    towerSprite.animationSpeed = 0.2
    towerSprite.type = type
    //animatedEnemySprite.play() // Only play when shoots
    towerSprite.name = name; // Unique identifier
    towerSprite.owner = owner;
    towerSprite.tint = randomColourCode
    towerSprite.gridX = col
    towerSprite.gridY = row
    towerSprite.x = towerSprite.gridX * DEFAULT_SPRITE_SIZE_X + DEFAULT_SPRITE_SIZE_X / 2;
    towerSprite.y = towerSprite.gridY * DEFAULT_SPRITE_SIZE_Y + DEFAULT_SPRITE_SIZE_Y / 2;

    if (owner == username) { // Only make the tower interactive if the user placed it
        towerSprite.interactive = true; // reponds to mouse and touch events
        towerSprite.buttonMode = true; // hand cursor appears when hover over
        towerSprite
            .on('click', onTowerClick)
            .on('clickoff', onTowerUnclick); // This is a custom event triggered manually

        let circleSprite = generateTowerRange(towerJson[towerSprite.type]["gameData"]["range"])
        circleSprite.x = towerSprite.x
        circleSprite.y = towerSprite.y
        circleSprite.name = towerSprite.name // Same name as tower
        circleSprite.visible = false
        towerDataContainer.addChild(circleSprite)
    }

    towerContainer.addChild(towerSprite)
}

function getTowerUpdateMsg(tower) {
    return {
        "y": tower.gridY,
        "x": tower.gridX,
        "value": {
            "type": tower.type,
            "owner": tower.owner,
            "colour": randomColourCode,
            "name": tower.name
        },
        "towerName": tower.name,
        "gameID": getGameID()
    }
}

/**
 * Interactive sprite of the tower the user has slected
 * Once interacted with, adds a sprite to replace the one taken
 * Can be placed on the map, or is removed otherwise
 * @param {Number/String?} type Tower type
 * @param {Number} x x position
 * @param {Number} y y position
 */
function addTempTower(type, x, y) {
    let name = randomHexString(6)
    let tempTowerSprite = getTowerSprite(type)
    tempTowerSprite.x = x
    tempTowerSprite.y = y
    tempTowerSprite.interactive = true
    tempTowerSprite.buttonMode = true;
    tempTowerSprite.name = name

    let tempTowerRangeSprite = generateTowerRange(towerJson[type]["gameData"]["range"])
    tempTowerRangeSprite.x = x
    tempTowerRangeSprite.y = y
    tempTowerRangeSprite.name = name
    tempTowerRangeSprite.interactive = true
    tempTowerRangeSprite.visible = false

    towerMenuContainer.addChild(tempTowerSprite)
    towerDataContainer.addChild(tempTowerRangeSprite)

    // Interaction options
    tempTowerSprite
        .on('pointerdown', function() {
            tempTowerRangeSprite
                .on('pointermove', onDragTower) // Moves the object bound to it
            tempTowerSprite
                .on('pointermove', onDragTower)
                .on('pointermove', onPlaceTower)
                .on('pointermove', () => {tempTowerRangeSprite.visible = true;}) // Have to register visibility on tower move, since cannot trigger events on the invisible object
                .on('pointerup', onPlaceTowerConfirm)
                .on('pointerupoutside', onPlaceTowerConfirm)
                .on('pointerup', ()=>{
                    towerMenuContainer.removeChild(tempTowerSprite)
                    towerDataContainer.removeChild(tempTowerRangeSprite)
                })
                .on('pointerupoutside', ()=>{
                    towerMenuContainer.removeChild(tempTowerSprite)
                    towerDataContainer.removeChild(tempTowerRangeSprite)
                })
                tempTowerSprite.alpha = 0.5
                addTempTower(type, x, y) // Recursively add another
            })
        .on('pointerup', onMenuTowerClick) // Effectively a click - click would not work in parallel to pointerdown
        .on('clickoff', onMenuTowerUnclick)
}

/**
 * Adds spot for the specified tower menu icon, then adds a sprite that can be interacted with
 * @param {Number} type Type of tower
 */
function addMenuTower(type) {
    // Calculate positon within the tower menu
    let towerMenuSprite = toolbarContainer.getChildByName("towerMenu")
    let towersCount = towerMenuContainer.children.length

    let towersPerRow = 2
    let toolbarWidth = towerMenuSprite.width
    let towerSpriteWidth = DEFAULT_SPRITE_SIZE_X
    let spacing = (toolbarWidth - (towersPerRow*towerSpriteWidth)) / (towersPerRow + 1)

    // Equally space the towers across the menu where all the spaces are equal width
    // <space><tower><space><tower><space>
    // |__________________________________|
    //                  |
    //               <toolbar>
    // toolbar = 2*tower + 3*space
    // space = (toolbar - 2*tower) / 3
    // We know toolbar width and tower width, so can work out space width. Then replace 2 and 3 with n and (n+1)
    let x = towerMenuSprite.x + (spacing + towerSpriteWidth/2) + ((spacing + towerSpriteWidth) * (towersCount % towersPerRow))
    let y = towerMenuSprite.y + DEFAULT_SPRITE_SIZE_Y * 2 * (Math.floor(towersCount/towersPerRow) + 1) // +1 so not starting at y = 0

    // Add a sprite where the menu icon has been positioned
    // When it is used (moved), put another one there
    addTempTower(type, x, y)
}

/**
 *
 * @param {Number} x x coordinate
 * @param {Number} y y coordinate
 * @param {Number} width_px 
 * @param {Number} height_px
 * @param {String} name
 * @param {String} col hex colour string. Default is grey (0x727272)
 */
function addToolbar(x, y, width_px, height_px, name, col=toolbarColourCode) {
    graphics.beginFill(col)
    graphics.drawRect(0, 0, width_px, height_px)
    let towerMenuBackgroundTexture = app.renderer.generateTexture(graphics)
    let towerMenuBackgroundSprite = new PIXI.Sprite(towerMenuBackgroundTexture) // create a sprite from graphics canvas
    towerMenuBackgroundSprite.x = x
    towerMenuBackgroundSprite.y = y
    towerMenuBackgroundSprite.name = name
    toolbarContainer.addChild(towerMenuBackgroundSprite)

    // Increase size of canvas if necessary
    if (x + width_px > app.view.width || x < 0) {
        app.view.width += width_px
        app.screen.width += width_px
        if (x < 0) app.stage.x += width_px // Shift main container (and thus everything in it)
    }
    if (y + height_px > app.view.height || y < 0) {
        app.view.height += height_px
        app.screen.height += height_px
        if (y < 0) app.stage.y += height_px
    }

    graphics.clear()
}


function addBullet(name, type) {
    let bulletSprite = new PIXI.AnimatedSprite(bulletSpriteSheet["simple"]) // TODO add bullet sprite
    bulletSprite.name = name
    bulletSprite.anchor.set(0.5)
    bulletContainer.addChild(bulletSprite)
}

function renderMap() {
    const MAP_SPRITE_SIZE_X = DEFAULT_SPRITE_SIZE_X // Width of a sprite in the map spritesheet
    const MAP_SPRITE_SIZE_Y = DEFAULT_SPRITE_SIZE_Y // Height of a sprite in the map spritesheet

    let rows = getBoard().length
    let cols = getBoard()[0].length

    // A texture is a WebGL-ready image
    // Keep things in a texture cache to make rendering fast and efficient
    let texture = PIXI.Loader.shared.resources["client/img/map_spritesheet.png"].texture

    let rectangle_1 = new PIXI.Rectangle(0, 0, MAP_SPRITE_SIZE_X, MAP_SPRITE_SIZE_Y);
    let rectangle_2 = new PIXI.Rectangle(0, MAP_SPRITE_SIZE_Y, MAP_SPRITE_SIZE_X, MAP_SPRITE_SIZE_Y);

    let green_square_texture = new PIXI.Texture(texture, rectangle_1)
    let brown_square_texture = new PIXI.Texture(texture, rectangle_2)

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Default to 0 aka grass
            var map_square_sprite = new PIXI.Sprite(green_square_texture);

            if (getBoard()[r][c] == 1) {
                map_square_sprite = new PIXI.Sprite(brown_square_texture);
            }
            map_square_sprite.y = r * MAP_SPRITE_SIZE_Y
            map_square_sprite.x = c * MAP_SPRITE_SIZE_X
            map_square_sprite.name = "map_" + r.toString() + "_" + c.toString()

            mapContainer.addChild(map_square_sprite);
        }
    }
}

// For a given tower type, gets the deescription info and renders it as text to the
// tower info toolbar
function writeTowerInfo(towerNum=0) {
    let towerInfoMenu = toolbarContainer.getChildByName("towerInfoMenu")
    let xMargin = 10

    let defaultStyle = {
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: towerInfoMenu.width - xMargin
    }
    let defaultX = towerInfoMenu.x + towerInfoMenu.width/2
    let defaultYGap = 20
    let defaultY = towerInfoMenu.y + defaultYGap

        // Title
    let text = new PIXI.Text('Tower Info', defaultStyle);
    text.x = Math.floor(defaultX)
    text.y = Math.floor(defaultY)
    text.name = "title"
    text.anchor.set(0.5)
    towerToolbarContentContainer.addChild(text);

    let towerInfo = towerJson[towerNum]["info"]
    for (let key in towerInfo) {
        defaultY += defaultYGap

        // Description title
        text = new PIXI.Text(key, defaultStyle);
        text.x = Math.floor(towerInfoMenu.x + xMargin)
        text.y = Math.floor(defaultY)
        text.name = key
        text.style.fontSize = 16
        towerToolbarContentContainer.addChild(text);

        // Description content
        text = new PIXI.Text(towerInfo[key], defaultStyle);
        text.x = Math.floor(towerInfoMenu.x + towerInfoMenu.width - xMargin)
        text.y = Math.floor(defaultY)
        text.anchor.set(1, 0) // Shift right
        text.name = key + "Value"
        text.style.fontWeight = "normal"
        text.style.fontSize = 16
        towerToolbarContentContainer.addChild(text);

    }
    //towerToolbarContentContainer.visible = false
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Events
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function onDragTower(event) {
    const newPosition = event.data.getLocalPosition(this.parent);
    if (isPointWithinContainer(newPosition.x, newPosition.y, mapContainer)) {
        // If on map, snap to grid
        let newGridX = Math.floor(newPosition.x / DEFAULT_SPRITE_SIZE_X)
        let newGridY = Math.floor(newPosition.y / DEFAULT_SPRITE_SIZE_Y)
        if ((newGridX != this.gridX || newGridY != this.gridY) && // Been some change
            getBoard()[newGridY][newGridX] == 0) { // Must be empty space
            this.gridX = newGridX
            this.gridY = newGridY
            this.x = this.gridX * DEFAULT_SPRITE_SIZE_X + DEFAULT_SPRITE_SIZE_X / 2;
            this.y = this.gridY * DEFAULT_SPRITE_SIZE_Y + DEFAULT_SPRITE_SIZE_Y / 2;
        }
    } else if (newPosition.x >= 0 && newPosition.y >= 0 && newPosition.x < app.view.width && newPosition.y < app.view.height) {
        // Otherwise, update position normally
        this.x = newPosition.x
        this.y = newPosition.y
    }
}

function onPlaceTower() {
    if (isPointWithinContainer(this.x, this.y, mapContainer)) {
        sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD, getTowerUpdateMsg(this))
    }
}

function onPlaceTowerConfirm() {
    if (isPointWithinContainer(this.x, this.y, mapContainer)) {
        let name = randomHexString(20)
        addTower(name, this.type, username, this.gridY, this.gridX)
        sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD_CONFIRM, getTowerUpdateMsg(towerContainer.getChildByName(name)))
    }
}

function onTowerClick(event) {
    if (activeClickable == this) { // Clicked on the currently active tower
        this.emit('clickoff');
    } else { // Clicked on tower that is not active
        if (typeof activeClickable != "undefined") activeClickable.emit('clickoff') // Cancel current active clickable
        activeClickable = this // Register this as the active object
        towerDataContainer.getChildByName(this.name).visible = true // Show the range circle
        writeTowerInfo(this.type)
        //towerToolbarContentContainer.visible = true // Show info about the tower
    }
}

function onMenuTowerClick(event) {
    if (activeClickable == this) { // Clicked on the currently active tower
        this.emit('clickoff');
    } else { // Clicked on tower that is not active
        if (typeof activeClickable != "undefined") activeClickable.emit('clickoff') // Cancel current active clickable
        activeClickable = this // Register this as the active object
        writeTowerInfo(this.type)
    }
}

function onTowerUnclick() {
    towerDataContainer.getChildByName(this.name).visible = false
    towerToolbarContentContainer.removeChildren()
    activeClickable = undefined
}

function onMenuTowerUnclick() {
    towerToolbarContentContainer.removeChildren()
    activeClickable = undefined
}

function onCanvasClick(event) {
    if (typeof activeClickable != "undefined") {
        if (!activeClickable.containsPoint(new PIXI.Point(event.layerX, event.layerY))) {
            activeClickable.emit('clickoff'); // clickoff event is agnostic to the type of object stored in activeClickable
        }
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Sprite updaters
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let enemyStateHashPrev = ""
function updateEnemies() {
    // Update position of any enemies
    // If enemy is not present, it has either been killed or reached the end of the path - so remove from container
    // We do this instead of a "kill this enemy" update in case the message does not come through or have two
    // server messages and one client render

    let state = getState(); // Get the state which has been updated separately from calls from the server
    if (state["enemies"].length == 0) return;

    let enemyStateObjects = state["enemies"]["objects"];
    let enemyStateHash = state["enemies"]["hash"];

    // Remove any enemies not present in server update
    // Add any enemies present in server update and not present in container
    // Only update if there has been a change to the enemy hash
    if (enemyStateHash != enemyStateHashPrev) { // TODO further optimisation - hash of all added and removed enemies
        enemyStateHashPrev = enemyStateHash

        for (let enemySpriteIdx = enemyContainer.children.length - 1; enemySpriteIdx >= 0; enemySpriteIdx--) {
            let found = false
            for (let nameIdx = 0; nameIdx < enemyStateObjects.length; nameIdx++) {
                // Whether enemy is found in enemyContainer, but not in server update
                found = (enemyContainer.children[enemySpriteIdx].name == enemyStateObjects[nameIdx].name)
                if (found) break; // Think this is ok
            }
            if (!found) enemyContainer.removeChildAt(enemySpriteIdx);
        }

        // Add any enemies not present in container i.e. just spawned
        for (let nameIdx = 0; nameIdx < enemyStateObjects.length; nameIdx++) {
            let found = false;
            for (let enemySpriteIdx = enemyContainer.children.length - 1; enemySpriteIdx >= 0; enemySpriteIdx--) {
                // Whether enemy if found in server update, but not in enemyContainer
                found = (enemyContainer.children[enemySpriteIdx].name == enemyStateObjects[nameIdx].name)
                if (found) break;
            }
            if (!found) addEnemy(enemyStateObjects[nameIdx].name)
        }
    }

    // Update state of enemies present in server update
    enemyStateObjects.forEach((enemy, idx) => {
        // Move the enemy
        let newPos = calculateGridPos(enemy.pathPos)
        let enemyToUpdate = enemyContainer.getChildByName(enemy.name)
        enemyToUpdate.x = newPos[0]
        enemyToUpdate.y = newPos[1]

        // Change tint if hit by bullet
        if (enemy.isHit) {
            enemyToUpdate.tint = 0xCCCCCC
            enemyToUpdate.tintCount = 10 // Number of frames to tint for
        }
        if (enemyToUpdate.tintCount > 0) {
            enemyToUpdate.tintCount -= 1
        } else {
            enemyToUpdate.tint = 0xFFFFFF
        }
    })
}

let towerStateHashPrev = ""
function updateTowers() {
    let state = getState(); // Get the state which has been updated separately from calls from the server
    let towerStateObjects = state["towers"]["objects"];
    let towerStateHash = state["towers"]["hash"];

    if (towerStateHash != towerStateHashPrev) {
        // Identify tower not in container but in server update
        let nameIdx = 0
        for (nameIdx; nameIdx < towerStateObjects.length; nameIdx++) {
            let found = false;
            for (let towerSpriteIdx = towerContainer.children.length - 1; towerSpriteIdx >= 0; towerSpriteIdx--) {
                found = (towerContainer.children[towerSpriteIdx].name == towerStateObjects[nameIdx].name)
                if (found) break;
            }
            if (!found) {
                addTower(towerStateObjects[nameIdx].name,
                    0,
                    towerStateObjects[nameIdx].owner,
                    towerStateObjects[nameIdx].posRowCol[0],
                    towerStateObjects[nameIdx].posRowCol[1])
            }
        }
    }

    // Update state of towers present in server update
    towerStateObjects.forEach((tower) => {
        // Move the tower angle
        let towerToUpdate = towerContainer.getChildByName(tower["name"])
        towerToUpdate.rotation = tower["angle"]
        towerToUpdate.tint = getBoard()[towerToUpdate.gridY][towerToUpdate.gridX].colour
    })
}

function updateBullets() {
    let state = getState(); // Get the state which has been updated separately from calls from the server
    let bulletStateObjects = state["bullets"]["objects"];
    // Update state of bullets present in server update
    bulletContainer.removeChildren() // This only works for bullets as they have no animation - othersiwe would have to keep track of the position in animation loop
    bulletStateObjects.forEach((bullet) => {
        addBullet(bullet["name"], "TODO") // New bullet

        // Move bullet
        bulletContainer.children[bulletContainer.children.length - 1].y = bullet["bulletPos"][0] * DEFAULT_SPRITE_SIZE_Y + bullet["bulletPos"][2] * (DEFAULT_SPRITE_SIZE_Y / SUBGRID_SIZE)
        bulletContainer.children[bulletContainer.children.length - 1].x = bullet["bulletPos"][1] * DEFAULT_SPRITE_SIZE_X + bullet["bulletPos"][3] * (DEFAULT_SPRITE_SIZE_X / SUBGRID_SIZE)
    })
}

/**
 *
 * @param {Number[4]} pathPos grid position array of form: [map row, map column, map square row, map square column]
 * @return {Number[2]} array of position of sprite in canvas [x, y]
 */
function calculateGridPos(pathPos) {
    let subGridSideLen = DEFAULT_SPRITE_SIZE_X / SUBGRID_SIZE
    return [
        // Map square                       Square within map square      Midway through square
        pathPos[1] * DEFAULT_SPRITE_SIZE_X + (pathPos[3] * subGridSideLen + subGridSideLen / 2),
        pathPos[0] * DEFAULT_SPRITE_SIZE_X + (pathPos[2] * subGridSideLen + subGridSideLen / 2)
    ]
}

function isPointWithinContainer(x, y, container) {
    let mapBounds = container.getLocalBounds()
    return (
        x >= mapBounds.x &&
        y >= mapBounds.y &&
        x < mapBounds.x + mapBounds.width &&
        y < mapBounds.y + mapBounds.height
    )
}

function gameLoop(delta) {
    // Called every time display is rendered
    updateEnemies();
    updateTowers();
    updateBullets();
}

//This `setup` function will run when the renderer has loaded
function setup() {
    // Sprites rendered later appear on top

    // Render the map once
    renderMap()

    // Generates the data that can be reused to make multiple sprites
    generateRedEnemySpritesheetData()
    generateTowerSpritesheetData()
    generateBulletSpritesheetData()

    // Render menu toolbars - increases canvas size if so
    addToolbar(0, app.view.height, MAP_WIDTH*DEFAULT_SPRITE_SIZE_Y, 3*DEFAULT_SPRITE_SIZE_Y, "bottomToolbar")
    addToolbar(mapContainer.width, 0, 5*DEFAULT_SPRITE_SIZE_X, app.view.height/2, "towerMenu")
    addToolbar(mapContainer.width, app.view.height/2, 5*DEFAULT_SPRITE_SIZE_X, app.view.height/2, "towerInfoMenu", "0x757575") // little bit lighter so can see the box

    addMenuTower(0) // First (and currently) only entry in towerJson array
    addMenuTower(1)
    addMenuTower(2)
    addMenuTower(3)

    app.view.addEventListener('click', (event) => onCanvasClick(event));

    // Start rendering loop
    // Note that ticker FPS is fixed to monitor rate
    app.ticker.add(delta => gameLoop(delta))
}

// Sets up PIXI app and run the `setup` function when it's done
export function startRendering() {
    // These will have been set in a previous setup call from the server
    MAP_WIDTH = getGridDimsRowsCols()[1]
    MAP_HEIGHT = getGridDimsRowsCols()[0]
    SUBGRID_SIZE = getSubGridDim()

    // Not this is starting width/height (just the game map). Toolbars are added later which resize
    APP_WIDTH = MAP_WIDTH * DEFAULT_SPRITE_SIZE_X
    APP_HEIGHT = MAP_HEIGHT * DEFAULT_SPRITE_SIZE_Y

    //Create a Pixi Application
    app = new PIXI.Application({
        width: APP_WIDTH,
        height: APP_HEIGHT
    });

    // Order in which display objects are added is the order they are put in the
    // children array, which is the order they are rendered.
    app.stage.addChild(mapContainer)
    app.stage.addChild(enemyContainer)
    app.stage.addChild(towerDataContainer)
    app.stage.addChild(toolbarContainer)
    app.stage.addChild(towerToolbarContentContainer)
    app.stage.addChild(towerMenuContainer)
    app.stage.addChild(bulletContainer)
    app.stage.addChild(towerContainer)

    const gameIDText = new PIXI.Text(getGameID());
    gameIDText.x = 20;
    gameIDText.y = 20;
    app.stage.addChild(gameIDText);

    //Add the canvas that Pixi automatically created to the HTML document
    document.body.appendChild(app.view);

    PIXI.Loader.shared
        .add("client/img/map_spritesheet.png")
        .add("client/img/enemy_spritesheet.png")
        .add("client/img/tower_spritesheet.png")
        .add("client/img/bullet_spritesheet.png")
        .load(setup);
}
