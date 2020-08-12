import { getState, getBoard, getGridDimsRowsCols} from "./state.js"
import { MSG_TYPES, sendMessage } from "./networking.js"
import { randomHexString } from "./tools.js"

const DEFAULT_SPRITE_SIZE_X = 32 // Width of a sprite in the map spritesheet
const DEFAULT_SPRITE_SIZE_Y = 32 // Height of a sprite in the map spritesheet

let MAP_WIDTH;
let MAP_HEIGHT;

// PIXI application
let app;

// Sprite containers
let mapContainer = new PIXI.Container();
let enemyContainer = new PIXI.Container();
let towerMenuContainer = new PIXI.Container();
let towerContainer = new PIXI.Container();

//load an image and run the `setup` function when it's done
function startRendering() {
    MAP_WIDTH = getGridDimsRowsCols()[1]
    MAP_HEIGHT = getGridDimsRowsCols()[0]

    //Create a Pixi Application
    app = new PIXI.Application({ width: MAP_WIDTH * DEFAULT_SPRITE_SIZE_X, height: MAP_HEIGHT * DEFAULT_SPRITE_SIZE_Y });

    // Order in which display objects are added is the order they are put in the
    // children array, which is the order they are rendered.
    app.stage.addChild(mapContainer)
    app.stage.addChild(enemyContainer)
    app.stage.addChild(towerMenuContainer)
    app.stage.addChild(towerContainer)

    //Add the canvas that Pixi automatically created to the HTML document
    document.body.appendChild(app.view);

    PIXI.Loader.shared
        .add("client/img/map_spritesheet.png")
        .add("client/img/enemy_spritesheet.png")
        .add("client/img/tower_spritesheet.png")
        .load(setup);
}

let towerSpriteSheet = {};
function generateBlueTowerSpritesheetData() {
    let texture = PIXI.Loader.shared.resources["client/img/tower_spritesheet.png"].texture
    towerSpriteSheet["blue"] = []
    towerSpriteSheet["blue"].push(new PIXI.Texture(texture, new PIXI.Rectangle(0, 0, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y)))
}

/**
 * Add tower with stats based off the type
 * @param {String} name Unique name of the tower object
 * @param {Number} type Type of tower
 */
function addTower(name, type, row, col) {
    let towerSprite = new PIXI.AnimatedSprite(towerSpriteSheet["blue"])
    towerSprite.loop = false
    towerSprite.anchor.set(0.5)
    towerSprite.animationSpeed = 0.2
    //animatedEnemySprite.play() // Only play when shoots
    towerSprite.name = name; // Unique identifier
    towerSprite.interactive = true; // reponds to mouse and touch events
    towerSprite.buttonMode = true; // hand cursor appears when hover over
    towerSprite.gridX = col
    towerSprite.gridY = row
    towerSprite.x = towerSprite.gridX*DEFAULT_SPRITE_SIZE_X
    towerSprite.y = towerSprite.gridY*DEFAULT_SPRITE_SIZE_Y
    towerSprite
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    // Set the properties because it will start by being dragged from menu
    towerSprite.alpha = 0.5;
    towerSprite.dragging = true;
    towerSprite.moved = false; // Whether it has moved form the original position TODO make more sophisticated and have an out of menu check

    towerContainer.addChild(towerSprite)
}

/**
 * Interactive menu sprite for a tower
 * When dragged, creates a new tower that can be placed on the map
 * @param {Number} type Type of tower
 */
function addMenuTower(type) {
    let towerSprite = new PIXI.AnimatedSprite(towerSpriteSheet["blue"]) // TODO make not animated
    towerSprite.loop = false
    towerSprite.anchor.set(0.5)
    towerSprite.name = "temporary_blue_tower_1" // Unique identifier
    towerSprite.interactive = true; // reponds to mouse and touch events
    towerSprite.buttonMode = true; // hand cursor appears when hover over
    towerSprite.x = (MAP_WIDTH-1)*DEFAULT_SPRITE_SIZE_X
    towerSprite.y = 3*DEFAULT_SPRITE_SIZE_Y
    towerSprite.on('pointerdown', function() {
        addTower(randomHexString(20), "", 3, (MAP_WIDTH-1))
    });

    towerMenuContainer.addChild(towerSprite)
}

function onDragStart(event) {
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    this.data = event.data;
    this.alpha = 0.5;
    this.dragging = true;
}

function onDragEnd() {
    if (this.moved) {  // If not moved off square of menu item, remove the sprite
        sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD_CONFIRM, [this.gridY, this.gridX, 2]) // Writes 2 to x, y in grid
        // Server then updates the board of each client - including this one
        this.alpha = 1;
        this.dragging = false;
        this.removeAllListeners();
    } else {
        towerContainer.removeChild(this);
    }
}

function onDragMove(event) {
    if (this.dragging) {
        const newPosition = event.data.getLocalPosition(this.parent);
        // Make it stick to map grid
        let newGridX = Math.floor(newPosition.x/DEFAULT_SPRITE_SIZE_X)
        let newGridY = Math.floor(newPosition.y/DEFAULT_SPRITE_SIZE_Y)
        if ((newGridX != this.gridX || newGridY != this.gridY) && // Been some change
            (newGridX >= 0 && newGridY >= 0 ) &&
            (newGridX < MAP_WIDTH && newGridY < MAP_HEIGHT) && 
            (getBoard()[newGridY][newGridX] == 0)) { // Must be empty space
            this.gridX = newGridX
            this.gridY = newGridY
            this.x = this.gridX * DEFAULT_SPRITE_SIZE_X + DEFAULT_SPRITE_SIZE_X/2;
            this.y = this.gridY * DEFAULT_SPRITE_SIZE_Y + DEFAULT_SPRITE_SIZE_Y/2;
            this.moved = true;
            
            // Send to server then all other clients - but don't actually write to the grid
            sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD, [this.gridY, this.gridX, 2])
        }
    }
}

// Sprite sheets (generated)
let enemySpriteSheet = {};

function generateRedEnemySpritesheetData() {
    let texture = PIXI.Loader.shared.resources["client/img/enemy_spritesheet.png"].texture
    enemySpriteSheet["red"] = []
    for (let i = 0; i < 6; ++i) {
        enemySpriteSheet["red"].push(new PIXI.Texture(texture, new PIXI.Rectangle(0, i * DEFAULT_SPRITE_SIZE_Y, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y)))
    }
}

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
    enemyContainer.addChild(animatedEnemySprite)
}

let enemyStateHashPrev = ""
function updateEnemies() {
    // Update position of any enemies
    // If enemy is not present, it has either been killed or reached the end of the path - so remove from container
    // We do this instead of a "kill this enemy" update in case the message dooes not come through or have two
    // server messages and one client render

    let state = getState(); // Get the state which has been updated separately from calls from the server
    let enemyStateObjects = state["enemies"]["objects"];
    let enemyStateHash = state["enemies"]["hash"];

    // Remove any enemies not present in server update
    // Add any enemies present in server update and not present in container
    // Only update if there has been a change to the enemy hash
    if (enemyStateHash != enemyStateHashPrev) { // TODO further optimisation - hash of all added and removed enemies
        enemyStateHashPrev = enemyStateHash

        for (let enemySpriteIdx = enemyContainer.children.length-1; enemySpriteIdx >= 0; enemySpriteIdx--) {
            let found = false
            for (let nameIdx = 0; nameIdx < enemyStateObjects.length; nameIdx++) {
                // Whether enemy is found in enemyContainer, but not in server update
                found = (enemyContainer.children[enemySpriteIdx].name == enemyStateObjects[nameIdx].name)
                if (found) break; // Think this is ok
            }
            if (!found) {
                //console.log("REMOVING old")
                enemyContainer.removeChildAt(enemySpriteIdx);
            }
        }

        // Add any enemies not present in container i.e. just spawned
        for (let nameIdx = 0; nameIdx < enemyStateObjects.length; nameIdx++) {
            let found = false;
            for (let enemySpriteIdx = enemyContainer.children.length-1; enemySpriteIdx >= 0; enemySpriteIdx--) {
                // Whether enemy if found in server update, but not in enemyContainer
                //console.log(enemyContainer.children[enemySpriteIdx].name, state["enemies"][nameIdx].name)
                found = (enemyContainer.children[enemySpriteIdx].name == enemyStateObjects[nameIdx].name)
                if (found) break;
            }
            if (!found) {
                //console.log("ADDING new")
                addEnemy(enemyStateObjects[nameIdx].name)
            }
        }
    }

    // Update state of enemies present in server update
    enemyStateObjects.forEach((enemy, idx) => {
        // Move the enemy
        let newPos = calculateGridPos(enemy.pathPos)
        enemyContainer.getChildByName(enemy.name).x = newPos[0]
        enemyContainer.getChildByName(enemy.name).y = newPos[1]
    })
}

export function renderMap() {
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

/**
 * Draws out a list of interactive towers that can be moved and places on the map
 */
function renderTowerMenu() {

}

function calculateGridPos(pathPos) {
    // Param: grid position array of form: [map row, map column, map square row, map square column]
    // Return: array of position of sprite in canvas [x, y]
    let divisionsPerSubGrid = 21 // TODO change form hard coded
    let subGridSideLen = DEFAULT_SPRITE_SIZE_X / divisionsPerSubGrid
    return [
        // Map square                       Square within map square      Midway through square
        pathPos[1]*DEFAULT_SPRITE_SIZE_X + (pathPos[3] * subGridSideLen + subGridSideLen/2),
        pathPos[0]*DEFAULT_SPRITE_SIZE_X + (pathPos[2] * subGridSideLen + subGridSideLen/2)
    ]
}

function gameLoop(delta) {
    // Called every time display is rendered
    updateEnemies();
}

//This `setup` function will run when the image has loaded
function setup() {
    // Sprites rendered later appear on top
    
    // Render the map once
    renderMap()
    
    // Generates the data that can be reused to make multiple sprites
    generateRedEnemySpritesheetData()
    generateBlueTowerSpritesheetData()

    // Render menu
    addMenuTower("TODO")

    // Start rendering loop
    // Note that ticker FPS is fixed to monitor rate
    app.ticker.add(delta => gameLoop(delta))
}

export { startRendering }