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

function addRedEnemy() {
    let animatedEnemySprite = new PIXI.AnimatedSprite(enemy_sprite_sheet["red"])
    animatedEnemySprite.loop = true
    animatedEnemySprite.anchor.set(0.5)
    animatedEnemySprite.animationSpeed = 0.2
    animatedEnemySprite.play()
    animatedEnemySprite.name = "abcde" // Unique (or at least should be) identifier
    enemyContainer.addChild(animatedEnemySprite)
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
    let state = getState() // Get the state which has been updated separately from calls from the server

    // Update position of any enemies
    // If enemy is not present, it has either been killed or reached the end of the path - so remove from container
    // We do this instead of a "kill this enemy" update in case the message dooes not come through or have two
    // server messages and one client render

    // Remove any enemies not present in server update
    for (let enemySpriteIdx = enemyContainer.children.length-1; enemySpriteIdx >= 0; enemySpriteIdx--) {
        let found = false
        for (let nameIdx = 0; nameIdx < state["enemies"].length; nameIdx++) {
            found = (enemyContainer.children[enemySpriteIdx].name == state["enemies"][nameIdx].name)
        }
        if (!found) {
            enemyContainer.removeChildAt(enemySpriteIdx);
        }
    }

    // Update state of enemies present in server update
    state["enemies"].forEach((enemy, idx) => {
        let newPos = calculateGridPos(enemy.pathPos)
        enemyContainer.getChildByName(enemy.name).x = newPos[0]
        enemyContainer.getChildByName(enemy.name).y = newPos[1]
    })
}

//This `setup` function will run when the image has loaded
function setup() {
    // Sprites rendered later appear on top
    
    // Render the map once
    renderMap()

    // Generates the data that can be reused to make multiple red enemies
    generateRedEnemySpritesheetData()

    // Use sprite sheet data to make single instance of red enemy
    addRedEnemy()

    // Start rendering loop
    app.ticker.add(delta => gameLoop(delta))
}

export { startRendering }