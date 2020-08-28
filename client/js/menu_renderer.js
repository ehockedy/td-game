import { randomHexString } from "./tools.js"
import { MSG_TYPES, sendMessage } from "./networking.js"
import { setGameID } from "./state.js"


const DEFAULT_SPRITE_SIZE_X = 32 // Width of a sprite in the map spritesheet
const DEFAULT_SPRITE_SIZE_Y = 32 // Height of a sprite in the map spritesheet

let APP_WIDTH = 900
let APP_HEIGHT = 600

// PIXI application
let app;

// Default style
let style = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 36,
    fontStyle: 'italic',
    fontWeight: 'bold',
    fill: ['#ffffff', '#00ff99'], // gradient
    stroke: '#4a1850',
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: false,
    wordWrapWidth: 440,
})

let titleStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 72,
    fontStyle: 'italic',
    fontWeight: 'bold',
    fill: ['#ffffff', '#00ff99'], // gradient
    stroke: '#4a1850',
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: false,
    wordWrapWidth: 440,
})


// Text setup
function renderTitle() {
    const text = new PIXI.Text('TOWER DEFENCE!', titleStyle);
    text.anchor.set(0.5);
    text.x = Math.floor(APP_WIDTH/2)
    text.y = Math.floor(APP_HEIGHT/3)
    text.startX = text.x
    text.startY = text.y
    text.name = "title"
    app.stage.addChild(text);
}

function renderStartGameButton() {
    const text = new PIXI.Text('START GAME', style);
    text.anchor.set(0.5);
    text.x = Math.floor(APP_WIDTH/3)
    text.y = Math.floor(APP_HEIGHT*2/3)
    text.interactive = true
    text.buttonMode = true;
    text.name = "start"

    text.on("click", onStartButtonClick)
            .on("tap", onStartButtonClick)
            .on("pointerover", onButtonHover)
            .on("pointerout", onButtonStopHover)

    app.stage.addChild(text);
}

function renderJoinGameButton() {
    const text = new PIXI.Text('JOIN GAME', style);
    text.anchor.set(0.5);
    text.x = Math.floor(APP_WIDTH*2/3)
    text.y = Math.floor(APP_HEIGHT*2/3)
    text.interactive = true
    text.buttonMode = true;
    text.name = "join"

    text.on("click", onJoinButtonClick)
            .on("tap", onJoinButtonClick)
            .on("pointerover", onButtonHover)
            .on("pointerout", onButtonStopHover)

    app.stage.addChild(text);
}

// Events
function onButtonHover() {
    this.scale.set(1.2)
}

function onButtonStopHover() {
    this.scale.set(1)
}

function onStartButtonClick() {
    let gameID = randomHexString(6)
    let data = {
        "gameID": gameID
    }
    setGameID(gameID)
    sendMessage(MSG_TYPES.NEW_GAME, data)
}

function onJoinButtonClick() {
    sendMessage(MSG_TYPES.NEW_GAME)
}

let dir = 1
function renderLoop() {
    // Make the title "bounce"
    let title = app.stage.getChildByName("title")
    const range = 10
    const speed = 1

    let displacement = title.y-title.startY
    let displacementProportionOfRange = Math.pow((1 - (range - displacement) / range ), 1)
    let toMove = Math.max(speed * displacementProportionOfRange, 0.01)

    title.y += dir * toMove

    if (title.y > title.startY+range) dir = -1
    else if (title.y < title.startY) dir = 1

}

function setup() {
    renderTitle()
    renderStartGameButton()
    renderJoinGameButton()

    app.ticker.add(() => renderLoop())
}

// Sets up PIXI app and run the `setup` function when it's done
export function startRendering() {
    //Create a Pixi Application
    app = new PIXI.Application({ width: APP_WIDTH, height: APP_HEIGHT});

    //Add the canvas that Pixi automatically created to the HTML document
    document.body.appendChild(app.view);

    PIXI.Loader.shared
        .load(setup);
}

export function stopRendering() {
    document.body.removeChild(app.view)
}