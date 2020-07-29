import { state, board } from "./state.js"

//Aliases
let loader = PIXI.Loader.shared,
    resources = PIXI.Loader.shared.resources,
    Sprite = PIXI.Sprite,
    Rectangle = PIXI.Rectangle;

//Create a Pixi Application
let app = new PIXI.Application({ width: 30*32, height: 24*32});

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

//load an image and run the `setup` function when it's done
loader
    .add("client/img/map_spritesheet.png")
    .load(setup);


function render() {
    console.log(state)
    renderMap()
}

export function renderLoop() {
    console.log("In loop")
    setInterval(render, 50*10);
}

export function renderMap() {
    const MAP_SPRITE_SIZE_X = 32 // Width of a sprite in the map spritesheet
    const MAP_SPRITE_SIZE_Y = 32 // Height of a sprite in the map spritesheet

    let rows = board.length
    let cols = board[0].length

    // A texture is a WebGL-ready image
    // Keep things in a texture cache to make rendering fast and efficient
    let texture = resources["client/img/map_spritesheet.png"].texture

    let rectangle_1 = new Rectangle(0, 0, MAP_SPRITE_SIZE_X, MAP_SPRITE_SIZE_Y);
    let rectangle_2 = new Rectangle(0, MAP_SPRITE_SIZE_Y, MAP_SPRITE_SIZE_X, MAP_SPRITE_SIZE_Y);

    let green_square_texture = new PIXI.Texture(texture, rectangle_1)
    let brown_square_texture = new PIXI.Texture(texture, rectangle_2)

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {            
            // Default to 0 aka grass
            var map_square_sprite = new Sprite(green_square_texture);
            
            if (board[r][c] == 1) {
                map_square_sprite = new Sprite(brown_square_texture);
            }
            map_square_sprite.y = r*MAP_SPRITE_SIZE_Y
            map_square_sprite.x = c*MAP_SPRITE_SIZE_X

            app.stage.addChild(map_square_sprite);
        }
    }
}


//This `setup` function will run when the image has loaded
function setup() {
 console.log("Loaded imgs")
}



// Automatically start rendering on script load - TODO CHANGE THIS!
renderLoop()
