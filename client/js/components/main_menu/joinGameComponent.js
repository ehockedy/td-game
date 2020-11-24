import { BaseMenuOptionComponent } from "./base/baseMenuOptionComponent.js"
import { setGameID } from "../../state.js"
import { APP_WIDTH, APP_HEIGHT } from "../../constants.js"
import { MSG_TYPES, sendJoinGameMessage, sendMessageGetAck } from "../../networking.js"

export class JoinGameComponent extends BaseMenuOptionComponent {
    constructor(sprite_handler, x, y) {
        super(sprite_handler, "joinGame", x, y, "Join Game")
        this.textSprite
            .on("click", ()=>{ this.onJoinButtonClick() })
            .on("tap", ()=>{ this.onJoinButtonClick() })
            .on("pointerover", this.onButtonHover)
            .on("pointerout", this.onButtonStopHover)

        this.popupContainer = new PIXI.Container()

        // Text box the user can enter the game code into
        // Joins the game (if exists) on enter
        this.gameCodeTextBox = this.createGameCodeTextBox()
        this.gameCodeTextBox.visible = false
        this.popupContainer.addChild(this.gameCodeTextBox)

        // Holds the response message for if the game does not exist or request times out
        this.joinGameResponseText = new PIXI.Text("");
        this.joinGameResponseText.style.fill = 0xFF2233;
        this.joinGameResponseText.x = APP_WIDTH/2
        this.joinGameResponseText.y = this.gameCodeTextBox.y + this.gameCodeTextBox.height/2 + 16
        this.joinGameResponseText.anchor.set(0.5)
        this.popupContainer.addChild(this.joinGameResponseText)
    }

    registerContainer() {
        super.registerContainer()
        this.sprite_handler.registerContainer(this.popupContainer)
    }

    onJoinButtonClick() {
        this.gameCodeTextBox.visible = true
        this.gameCodeTextBox.select()
        this.gameCodeTextBox.text = ""
    }

    createGameCodeTextBox() {
        let input = new PIXI.TextInput({
            input: {
                fontSize: '36px',
                padding: '12px',
                width: '500px',
                color: '#26272E'
            },
            box: {
                default: {fill: 0xE8E9F3, rounded: 12, stroke: {color: 0xCBCEE0, width: 3}},
                focused: {fill: 0xE1E3EE, rounded: 12, stroke: {color: 0xABAFC6, width: 3}},
                disabled: {fill: 0xDBDBDB, rounded: 12}
            }
        })
        
        input.placeholder = 'Enter game code...'
        input.x = APP_WIDTH/2
        input.y = APP_HEIGHT*4/5
        input.pivot.x = input.width/2
        input.pivot.y = input.height/2
        input.maxLength = 4
        input.htmlInput.setAttribute("spellcheck", false)

        input
        .on('keydown', keycode => {
            if (keycode == 27) { // ESC
                input.visible = false
            } else if (keycode == 13) { // Enter
                this.sendJoinGameRequest(input.text)
            }
        })
        .on('input', text => {
            input.text = text.toUpperCase()
            input._update()
        })
        .on('blur', ()=>{
            input.visible = false
        })

        return input
    }

    sendJoinGameRequest(userInput) {
        let _this = this
        sendMessageGetAck(MSG_TYPES.CHECK_GAME, { "gameID": userInput })
        .then(function(resolveVal) {
            if (resolveVal["response"] == "fail") { // Game does not exist
                _this.joinGameResponseText.text = "Game not found"
                setTimeout(()=>{ _this.joinGameResponseText.text = "" }, 2000);
            } else if (resolveVal["response"] == "success") { // Game exists
                sendJoinGameMessage( { "gameID": userInput } )
                setGameID(userInput)
            }
        }).catch(function(rejectVal) {
            if (rejectVal["response"] == "timeout") {
                _this.joinGameResponseText.text = "Connection with server timed out"
                setTimeout(()=>{ _this.joinGameResponseText.text = "" }, 2000);
            }
        })
    }
}