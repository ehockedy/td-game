import { getState, getBoard } from "./state.js"

const DEFAULT_SPRITE_SIZE_X = 32 // Width of a sprite in the map spritesheet
const DEFAULT_SPRITE_SIZE_Y = 32 // Height of a sprite in the map spritesheet

//Create a Pixi Application
let app = new PIXI.Application({ width: 30 * 32, height: 24 * 32 });

// Order in which display objects are added is the order they are put in the
// children array, which is the order they are rendered.
let mapContainer = new PIXI.Container();
app.stage.addChild(mapContainer)

let enemyContainer = new PIXI.Container();
app.stage.addChild(enemyContainer)

//Add the canvas that Pixi automatically created for you to the HTML document
// TODO put in a setup call
document.body.appendChild(app.view);

//load an image and run the `setup` function when it's done
function startRendering() {
    PIXI.Loader.shared
        .add("client/img/map_spritesheet.png")
        .add("client/img/enemy_spritesheet.png")
        .load(setup);
}

// Sprite sheets (generated)
let enemy_sprite_sheet = {};

function generateRedEnemySpritesheetData() {
    let texture = PIXI.Loader.shared.resources["client/img/enemy_spritesheet.png"].texture
    enemy_sprite_sheet["red"] = []
    for (let i = 0; i < 6; ++i) {
        enemy_sprite_sheet["red"].push(new PIXI.Texture(texture, new PIXI.Rectangle(0, i * DEFAULT_SPRITE_SIZE_Y, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y)))
    }
}

/**
 * Add enemy with stats based off the type
 * @param {String} name Unique name of the enemy object
 * @param {Number} type Type of enemy
 */
function addEnemy(name, type) {
    // TODO have different types
    let animatedEnemySprite = new PIXI.AnimatedSprite(enemy_sprite_sheet["red"])
    animatedEnemySprite.loop = true
    animatedEnemySprite.anchor.set(0.5)
    animatedEnemySprite.animationSpeed = 0.2
    animatedEnemySprite.play()
    animatedEnemySprite.name = name // Unique identifier
    //animatedEnemySprite.onLoop = function() { console.log(animatedEnemySprite.name); };
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
        console.log("Updating enemies")

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
    } else {
        console.log("Not updating enemies")
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
    console.log("RENDER SETUP")
    // Sprites rendered later appear on top
    
    // Render the map once
    renderMap()

    // Generates the data that can be reused to make multiple red enemies
    generateRedEnemySpritesheetData()

    // Start rendering loop
    app.ticker.add(delta => gameLoop(delta))
}

export { startRendering }