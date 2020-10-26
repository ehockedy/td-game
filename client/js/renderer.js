import { getState, getBoard, getGameID, getUsername } from "./state.js"
import { randomHexString } from "./tools.js"
import { Toolbar } from "./views/game/toolbar.js"
import { TowerToolbar } from "./views/game/towerToolbar.js"
import { SUBGRID_SIZE, RIGHT_TOOLBAR_WIDTH, BOTTOM_TOOLBAR_WIDTH, BOTTOM_TOOLBAR_HEIGHT, MAP_WIDTH, MAP_HEIGHT, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y, APP_HEIGHT, APP_WIDTH} from "./views/constants.js"
import { TowerManager } from "./views/game/tower.js"
import { onCanvasClick } from "./views/game/callbacks.js"

// PIXI application
let app;

// Sprite containers
let mapContainer = new PIXI.Container(); // The grid all the action takes place in
let toolbarContainer = new PIXI.Container(); // Tower menu background, player stats background, etc.
let towerToolbarContentContainer = new PIXI.Container(); // Info about the tower
let enemyContainer = new PIXI.Container(); // All the enemies on the map
let bulletContainer = new PIXI.Container(); // All the bullets on the map

let towerManager = new TowerManager()

// Spritesheet data
let enemySpriteSheet = {};
let bulletSpriteSheet = {};

// TODO make these general use function to generate animated sprite sheet data
function generateRedEnemySpritesheetData() {
    let texture = PIXI.Loader.shared.resources["client/img/enemy_spritesheet.png"].texture
    enemySpriteSheet["red"] = []
    for (let i = 0; i < 6; ++i) {
        enemySpriteSheet["red"].push(new PIXI.Texture(texture, new PIXI.Rectangle(0, i * DEFAULT_SPRITE_SIZE_Y, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y)))
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

            if (getBoard()[r][c]["value"] == 1) {
                map_square_sprite = new PIXI.Sprite(brown_square_texture);
            }
            map_square_sprite.y = r * MAP_SPRITE_SIZE_Y
            map_square_sprite.x = c * MAP_SPRITE_SIZE_X
            map_square_sprite.name = "map_" + r.toString() + "_" + c.toString()

            mapContainer.addChild(map_square_sprite);
        }
    }
}

// For a given tower type, gets the description info and renders it as text to the
// tower info toolbar
function writeTowerInfo(towerNum) {
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

    let towerInfo = towerJson[towerNum]["displayInfo"]
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
        towerStateHashPrev = towerStateHash

        // Identify tower not in container but in server update
        let nameIdx = 0
        for (nameIdx; nameIdx < towerStateObjects.length; nameIdx++) {
            let found = false;
            for (let towerSpriteIdx = towerManager.towerContainer.children.length - 1; towerSpriteIdx >= 0; towerSpriteIdx--) {
                found = (towerManager.towerContainer.children[towerSpriteIdx].name == towerStateObjects[nameIdx].name)
                if (found) break;
            }
            if (!found) {
                towerManager.addPlacedTower(towerStateObjects[nameIdx].type,
                    towerStateObjects[nameIdx].name,
                    towerStateObjects[nameIdx].owner,
                    towerStateObjects[nameIdx].posRowCol.row,
                    towerStateObjects[nameIdx].posRowCol.col)
            }
        }
    }

    // Update state of towers present in server update
    towerStateObjects.forEach((tower) => {
        towerManager.updateTower(tower.name, tower.angle)
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
    generateBulletSpritesheetData()

    let toolbarTowers = new TowerToolbar(RIGHT_TOOLBAR_WIDTH, MAP_HEIGHT/2, MAP_WIDTH, 0, towerManager)
    let toolbarTowerInfo = new Toolbar(RIGHT_TOOLBAR_WIDTH, MAP_HEIGHT/2, MAP_WIDTH, MAP_HEIGHT/2)
    let toolbarPlayerInfo = new Toolbar(BOTTOM_TOOLBAR_WIDTH, BOTTOM_TOOLBAR_HEIGHT, 0, MAP_HEIGHT)

    // Order in which display objects are added is the order they are put in the
    // children array, which is the order they are rendered.
    app.stage.addChild(mapContainer)
    app.stage.addChild(enemyContainer)
    app.stage.addChild(towerManager.towerDataContainer)
    app.stage.addChild(toolbarTowers.container)
    app.stage.addChild(toolbarTowerInfo.container)
    app.stage.addChild(toolbarPlayerInfo.container)
    app.stage.addChild(bulletContainer)
    app.stage.addChild(towerManager.towerContainer)

    app.view.addEventListener('click', (event) => onCanvasClick(event));

    // Start rendering loop
    // Note that ticker FPS is fixed to monitor rate
    app.ticker.add(delta => gameLoop(delta))
}

// Sets up PIXI app and run the `setup` function when it's done
export function startRendering() {
    //Create a Pixi Application
    app = new PIXI.Application({
        width: APP_WIDTH,
        height: APP_HEIGHT
    });

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
