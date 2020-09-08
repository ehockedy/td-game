import { randomHexString } from "./tools.js"
import { MSG_TYPES, sendMessage, sendMessageGetAck } from "./networking.js"
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
})

let textBoxStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 24,
    fill: ['#000000'], // gradient
    align: "center",
    wordWrap: true,
})

let graphics = new PIXI.Graphics();

// Containers
let menuElementsContainer = new PIXI.Container();
let joinGamePopUpContainer = new PIXI.Container();

// Text setup
function renderTitle() {
    const text = new PIXI.Text('TOWER DEFENCE!', titleStyle);
    text.anchor.set(0.5);
    text.x = Math.floor(APP_WIDTH/2)
    text.y = Math.floor(APP_HEIGHT/3)
    text.startX = text.x
    text.startY = text.y
    text.name = "title"
    menuElementsContainer.addChild(text);
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

    menuElementsContainer.addChild(text);
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

    menuElementsContainer.addChild(text);
}

// Events
function onButtonHover() {
    this.scale.set(1.2)
}

function onButtonStopHover() {
    this.scale.set(1)
}

function onStartButtonClick() {
    let gameID = randomHexString(6).toUpperCase()
    let data = {
        "gameID": gameID
    }
    setGameID(gameID)
    sendMessage(MSG_TYPES.NEW_GAME, data)
}

function onJoinButtonClick() {
    document.addEventListener('keydown', logKey);
    graphics.beginFill("0x7722AA")
    graphics.drawRect(0, 0, APP_WIDTH/3, APP_HEIGHT/3)

    // Pup up box
    let rectTexture = app.renderer.generateTexture(graphics)
    let rectSprite = new PIXI.Sprite(rectTexture) // create a sprite from graphics canvas
    rectSprite.x = APP_WIDTH/2
    rectSprite.y = APP_HEIGHT/2
    rectSprite.name = "popup"
    rectSprite.anchor.set(0.5)
    rectSprite.interactive = true
    rectSprite.on("tap", onCodeBoxTap)
    joinGamePopUpContainer.addChild(rectSprite)
    graphics.clear()

    // Text box
    graphics.beginFill("0xFFFFFF")
    graphics.drawRect(0, 0, rectSprite.width*0.8, rectSprite.height/5)
    let textTexture = app.renderer.generateTexture(graphics)
    let textBoxSprite = new PIXI.Sprite(textTexture) // create a sprite from graphics canvas
    textBoxSprite.x = rectSprite.x
    textBoxSprite.y = rectSprite.y + rectSprite.height / 6
    textBoxSprite.name = "popupTextbox"
    textBoxSprite.anchor.set(0.5)
    joinGamePopUpContainer.addChild(textBoxSprite)
    graphics.clear()

    // Game code text
    const text = new PIXI.Text("", textBoxStyle);
    text.anchor.set(0.5);
    text.x = textBoxSprite.x
    text.y = textBoxSprite.y
    text.name = "popupText"
    joinGamePopUpContainer.addChild(text);

    // Error message text
    textBoxStyle.wordWrapWidth = rectSprite.x * 0.6
    const infoText = new PIXI.Text("Enter code to join game", textBoxStyle);
    infoText.anchor.set(0.5);
    infoText.x = rectSprite.x
    infoText.y = rectSprite.y - rectSprite.height / 6
    infoText.name = "popupInfoText"
    joinGamePopUpContainer.addChild(infoText);

    // Bring focus to the input box - if on mobile, this will bring up the browser keyboard
    // NOTE: this only oberved to work on Android Firefox, does not work on Android Chrome
    $('#mobileKeyboard').focus();
}

function onCodeBoxTap() {
    $('#mobileKeyboard').blur(); // unfocus, since may already be focussed
    $('#mobileKeyboard').focus();
    sendMessage(MSG_TYPES.CLIENT_DEBUG, "TAPPED")
}

function logKey(e) {
    const regex = RegExp('^[a-zA-z0-9]$'); // Only a single characters or number
    sendMessage(  MSG_TYPES.CLIENT_DEBUG,  [e.key, e.code]  )
    if (regex.test(e.key)) {
        if (joinGamePopUpContainer.getChildByName("popupText").text.length < 6) {
            joinGamePopUpContainer.getChildByName("popupText").text += e.key.toUpperCase()
        }
    } else if (e.key == "Enter") { // Enter confirms the code and attempts to join game (if code valie and game exists)
        if (joinGamePopUpContainer.getChildByName("popupText").text.length < 6) {
            joinGamePopUpContainer.getChildByName("popupInfoText").text = "Error: game code must be 6 characters"
            return
        }

        joinGamePopUpContainer.getChildByName("popupInfoText").text = "Searching for game..."

        sendMessageGetAck(
            MSG_TYPES.JOIN_GAME,
            {
                "gameID": joinGamePopUpContainer.getChildByName("popupText").text
            }
        ).then(function(resolveVal) {
            if (resolveVal["response"] == "fail") { // Game does not exist
                joinGamePopUpContainer.getChildByName("popupInfoText").text = "Game not found"
            } else if (resolveVal["response"] == "success") { // Game exists
                setGameID(joinGamePopUpContainer.getChildByName("popupText").text)
                joinGamePopUpContainer.removeChildren() // TODO make not visible?
                document.removeEventListener('keydown', logKey);
            }
        }).catch(function(rejectVal) {
            if (rejectVal["response"] == "timeout") {
                joinGamePopUpContainer.getChildByName("popupInfoText").text = "Error: Connection with server timed out"
            }
        })
    } else if (e.key == "Backspace") {
        joinGamePopUpContainer.getChildByName("popupText").text = joinGamePopUpContainer.getChildByName("popupText").text.slice(0, -1)
    } else if (e.key == "Escape") {
        // TODO make these a "close join menu" option (since used above)
        joinGamePopUpContainer.removeChildren() // TODO make not visible?
        document.removeEventListener('keydown', logKey);
    }
}

let dir = 1
function renderLoop() {
    // Make the title "bounce"
    let title = menuElementsContainer.getChildByName("title")
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
    app.stage.addChild(menuElementsContainer);
    app.stage.addChild(joinGamePopUpContainer);

    PIXI.Loader.shared
        .load(setup);
}

export function stopRendering() {
    app.stage.removeChildren()
    document.body.removeChild(app.view)
}