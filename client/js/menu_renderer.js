import { getGridDimsRowsCols } from "./state.js"
import { MSG_TYPES, sendMessage } from "./networking.js"


const DEFAULT_SPRITE_SIZE_X = 32 // Width of a sprite in the map spritesheet
const DEFAULT_SPRITE_SIZE_Y = 32 // Height of a sprite in the map spritesheet

let APP_WIDTH = 900
let APP_HEIGHT = 720

// PIXI application
let app;

function renderStartGameButton() {
    const buttonTexture = PIXI.Texture.from('client/img/start_button.png');
    let buttonSprite = new PIXI.Sprite(buttonTexture);

    buttonSprite.anchor.set(0.5);
    buttonSprite.x = Math.floor(APP_WIDTH/2)
    buttonSprite.y = Math.floor(APP_HEIGHT/2)
    buttonSprite.interactive = true
    buttonSprite.buttonMode = true; // hand cursor appears when hover over

    buttonSprite.on("click", onButtonClick)
                .on("tap", onButtonClick)

    app.stage.addChild(buttonSprite)
}

function onButtonClick() {
    console.log("BUTTON CLICKED")
    sendMessage(MSG_TYPES.NEW_GAME)
}

function setup() {
    
    renderStartGameButton()
    // Start rendering loop
    // Note that ticker FPS is fixed to monitor rate
    //app.ticker.add(delta => gameLoop(delta))
}

// Sets up PIXI app and run the `setup` function when it's done
export function startRendering() {
    //Create a Pixi Application
    app = new PIXI.Application({ width: APP_WIDTH, height: APP_HEIGHT});

    //Add the canvas that Pixi automatically created to the HTML document
    document.body.appendChild(app.view);

    PIXI.Loader.shared
        .add("client/img/start_button.png")
        .load(setup);
}

export function stopRendering() {
    document.body.removeChild(app.view)
}