import { state, board, enemies } from "./state.js"

const DEFAULT_SPRITE_SIZE_X = 32 // Width of a sprite in the map spritesheet
const DEFAULT_SPRITE_SIZE_Y = 32 // Height of a sprite in the map spritesheet

//Create a Pixi Application
let app = new PIXI.Application({ width: 30 * 32, height: 24 * 32 });

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

//load an image and run the `setup` function when it's done
PIXI.Loader.shared
    .add("client/img/map_spritesheet.png")
    .add("client/img/enemy_spritesheet.png")
    .load(setup);

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
    animatedEnemySprite.animationSpeed = 0.5
    animatedEnemySprite.play()
    animatedEnemySprite.name = "abcde" // Unique (or at least should be) identifier
    app.stage.addChild(animatedEnemySprite)
}

export function renderMap() {
    const MAP_SPRITE_SIZE_X = DEFAULT_SPRITE_SIZE_X // Width of a sprite in the map spritesheet
    const MAP_SPRITE_SIZE_Y = DEFAULT_SPRITE_SIZE_Y // Height of a sprite in the map spritesheet

    let rows = board.length
    let cols = board[0].length

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

            if (board[r][c] == 1) {
                map_square_sprite = new PIXI.Sprite(brown_square_texture);
            }
            map_square_sprite.y = r * MAP_SPRITE_SIZE_Y
            map_square_sprite.x = c * MAP_SPRITE_SIZE_X
            map_square_sprite.name = "map_" + r.toString() + "_" + c.toString()
            
            app.stage.addChild(map_square_sprite);
        }
    }
}

let x_dir = 1
let y_dir = 1
function gameLoop(delta) {
    // Makes the enemy move like a DVD screensaver

    app.stage.getChildByName("abcde").x += (1*x_dir)
    app.stage.getChildByName("abcde").y += (1*y_dir)

    if (app.stage.getChildByName("abcde").x == 29 * 32|| app.stage.getChildByName("abcde").x == 0) {
        x_dir*=-1 // Reverse direction of horizontal travel
    }
    if (app.stage.getChildByName("abcde").y == 23 * 32 || app.stage.getChildByName("abcde").y == 0) {
        y_dir*=-1 // Reverse direction of vertical travel
    }
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
