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

// TODO make these general use function to gerenrate animated sprite sheet data
function generateRedEnemySpritesheetData() {
    let texture = PIXI.Loader.shared.resources["client/img/enemy_spritesheet.png"].texture
    enemySpriteSheet["red"] = []
    for (let i = 0; i < 6; ++i) {
        enemySpriteSheet["red"].push(new PIXI.Texture(texture, new PIXI.Rectangle(0, i * DEFAULT_SPRITE_SIZE_Y, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y)))
    }
}

function generateBlueTowerSpritesheetData() {
    let texture = PIXI.Loader.shared.resources["client/img/tower_spritesheet.png"].texture
    towerSpriteSheet["blue"] = []
    towerSpriteSheet["blue"].push(new PIXI.Texture(texture, new PIXI.Rectangle(0, 0, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y)))
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

/**
 * Add tower with stats based off the type
 * @param {String} name Unique name of the tower object
 * @param {Number} type Type of tower
 */
function addTower(name, type, owner, row, col) {
    let towerSprite = new PIXI.AnimatedSprite(towerSpriteSheet["blue"])
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
            .on('pointerup', onDragEnd)
            .on('pointerupoutside', onDragEnd)
            .on('pointermove', onDragMove)
            .on('click', onTowerClick)
            .on('clickoff', onTowerUnclick); // This is a custom event triggered manually


        // Add the area circle sprite too
        graphics.beginFill("0xe74c3c") // Red
        graphics.alpha = 0.5
        graphics.drawCircle(0, 0, towerJson[towerSprite.type]["range"] * DEFAULT_SPRITE_SIZE_Y) // position 0, 0 of the graphics canvas

        let circleTexture = app.renderer.generateTexture(graphics)
        let circleSprite = new PIXI.Sprite(circleTexture) // create a sprite from graphics canvas
        circleSprite.x = towerSprite.x
        circleSprite.y = towerSprite.y
        circleSprite.name = towerSprite.name // Same name as tower
        circleSprite.anchor.set(0.5)
        circleSprite.visible = false
        towerDataContainer.addChild(circleSprite)
        graphics.clear()
    }

    towerContainer.addChild(towerSprite)
}

/**
 * Interactive menu sprite for a tower
 * When dragged, creates a new tower that can be placed on the map
 * @param {Number} type Type of tower
 */
function addMenuTower(type) {
    let menuTowerSprite = new PIXI.AnimatedSprite(towerSpriteSheet["blue"]) // TODO make not animated
    menuTowerSprite.loop = false
    menuTowerSprite.anchor.set(0.5)
    menuTowerSprite.name = "temporary_blue_tower_1" // Unique identifier
    menuTowerSprite.tint = randomColourCode
    menuTowerSprite.interactive = true; // reponds to mouse and touch events
    menuTowerSprite.buttonMode = true; // hand cursor appears when hover over

    let towersCount = towerMenuContainer.children.length

    // Calcualte positon within the tower menu
    let towerMenuSprite = toolbarContainer.getChildByName("towerMenu")

    let towersPerRow = 2
    let toolbarWidth = towerMenuSprite.width
    let towerSpriteWidth = menuTowerSprite.width
    let spacing = (toolbarWidth - (towersPerRow*towerSpriteWidth)) / (towersPerRow + 1)

    // Equally space the towers across the menu where all the spaces are equal width
    // <space><tower><space><tower><space>
    // |__________________________________|
    //                  |
    //               <toolbar>
    // toolbar = 2*tower + 3*space
    // space = (toolbar - 2*tower) / 3
    // We know toolbar width and towe width, so can work out space width. THen replace 2 and 3 with n and (n+1)
    menuTowerSprite.x = towerMenuSprite.x + (spacing + towerSpriteWidth/2) + ((spacing + towerSpriteWidth) * (towersCount % towersPerRow))
    menuTowerSprite.y = towerMenuSprite.y + DEFAULT_SPRITE_SIZE_Y * 2 * (Math.floor(towersCount/towersPerRow) + 1) // +1 so not starting at y = 0

    menuTowerSprite
        .on('pointerdown', function () {
            let newTowerName = randomHexString(20)
            addTower(newTowerName, type, username, menuTowerSprite.x, menuTowerSprite.y) // TODO pass json string ID/name
            let towerSprite = towerContainer.getChildByName(newTowerName) // TODO don't do this, get from above call somehow

            // Set the properties because it will start by being dragged from menu
            towerSprite.alpha = 0.5;
            towerSprite.dragging = true;
            towerSprite.gridlocked = false // Whether to stick to the grid of DEFAULT_SPRITE_SIZE[X|Y] sized squares
            towerDataContainer.getChildByName(newTowerName).visible = true
        })

    towerMenuContainer.addChild(menuTowerSprite)
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
    towerToolbarContentContainer.visible = false
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Events
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function onDragStart(event) {
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    this.data = event.data;
    this.alpha = 0.5;
    this.dragging = true;
}

function onDragEnd() {
    if (isPointWithinContainer(this.x, this.y, mapContainer)) {  // If not moved off menu, remove the sprite
        sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD_CONFIRM, {
            "y": this.gridY,
            "x": this.gridX,
            "value": {
                "type": "tower",
                "owner": username,
                "colour": randomColourCode,
                "name": this.name
            },
            "towerName": this.name,
            "gameID": getGameID()
        }) // Writes 2 to x, y in grid
        // Server then updates the board of each client - including this one
        this.alpha = 1;
        this.dragging = false;
        this.off('pointerupoutside', onDragEnd)
            .off('pointermove', onDragMove)
            .off('pointerup', onDragEnd);

        // Clear the red range circle
        towerDataContainer.getChildByName(this.name).visible = false
    } else {
        towerContainer.removeChild(this); // TODO could remove anyway and just let the server update add it
    }
}

function onDragMove(event) {
    if (this.dragging) {
        const newPosition = event.data.getLocalPosition(this.parent);

        // Check if out of windoe - if so do not update position
        if (newPosition.x < 0 || newPosition.y < 0 || newPosition.x > APP_WIDTH || newPosition.y > APP_HEIGHT) {
            return;
        }

        // Check if within the map - if so make it snap to grid
        if (isPointWithinContainer(newPosition.x, newPosition.y, mapContainer)) {

            let newGridX = Math.floor(newPosition.x / DEFAULT_SPRITE_SIZE_X)
            let newGridY = Math.floor(newPosition.y / DEFAULT_SPRITE_SIZE_Y)
            if ((newGridX != this.gridX || newGridY != this.gridY) && // Been some change
                getBoard()[newGridY][newGridX] == 0) { // Must be empty space
                this.gridX = newGridX
                this.gridY = newGridY
                this.x = this.gridX * DEFAULT_SPRITE_SIZE_X + DEFAULT_SPRITE_SIZE_X / 2;
                this.y = this.gridY * DEFAULT_SPRITE_SIZE_Y + DEFAULT_SPRITE_SIZE_Y / 2;

                let rangeCircleToUpdate = towerDataContainer.getChildByName(this.name)
                rangeCircleToUpdate.visible = true
                rangeCircleToUpdate.x = this.x
                rangeCircleToUpdate.y = this.y

                // Send to server then all other clients - but don't actually write to the grid
                sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD, {
                    "y": this.gridY,
                    "x": this.gridX,
                    "value": {
                        "type": "tower",
                        "owner": username,
                        "colour": randomColourCode,
                        "name": this.name
                    },
                    "gameID": getGameID()
                })
            }
        } else {
            this.x = newPosition.x
            this.y = newPosition.y
            towerDataContainer.getChildByName(this.name).visible = false
        }
    }
}

function onTowerClick() {
    if (activeClickable == this) { // Clicked on the currently active tower
        this.emit('clickoff');
    } else { // Clicked on tower that is not active
        if (typeof activeClickable != "undefined") activeClickable.emit('clickoff') // Cancel current active clickable
        activeClickable = this // Register this as the active object
        towerDataContainer.getChildByName(this.name).visible = true // Show the range circle
        towerToolbarContentContainer.visible = true // Show info about the tower
    }
}

function onTowerUnclick() {
    towerDataContainer.getChildByName(this.name).visible = false
    towerToolbarContentContainer.visible = false
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
                //console.log(enemyContainer.children[enemySpriteIdx].name, state["enemies"][nameIdx].name)
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
    generateBlueTowerSpritesheetData()
    generateBulletSpritesheetData()

    // Render menu toolbars - increases canvas size if so
    addToolbar(0, app.view.height, MAP_WIDTH*DEFAULT_SPRITE_SIZE_Y, 3*DEFAULT_SPRITE_SIZE_Y, "bottomToolbar")
    addToolbar(mapContainer.width, 0, 5*DEFAULT_SPRITE_SIZE_X, app.view.height/2, "towerMenu")
    addToolbar(mapContainer.width, app.view.height/2, 5*DEFAULT_SPRITE_SIZE_X, app.view.height/2, "towerInfoMenu", "0x757575") // little bit lighter so can see the box
    writeTowerInfo(0)

    addMenuTower(0) // First (and currently) only entry in towerJson array
    addMenuTower(0)
    addMenuTower(0)

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
    app.stage.addChild(toolbarContainer)
    app.stage.addChild(towerToolbarContentContainer)
    app.stage.addChild(enemyContainer)
    app.stage.addChild(towerMenuContainer)
    app.stage.addChild(towerDataContainer)
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
