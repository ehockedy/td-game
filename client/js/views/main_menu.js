import { MenuTitle } from "../components/main_menu/title.js"
import { NewGameComponent } from "../components/main_menu/newGameComponent.js"
import { JoinGameComponent } from "../components/main_menu/joinGameComponent.js"
import { APP_HEIGHT, APP_WIDTH } from "../constants.js"
import { addSocketEvent, MSG_TYPES } from "../networking.js"

/**
 * This class sets up what will appear in the main menu view.
 */
export class MainMenuRenderer {
    constructor(spriteHandler) {
        this.spriteHandler = spriteHandler
        this.title = new MenuTitle(this.spriteHandler, APP_WIDTH/2, APP_HEIGHT/3)
        this.newGame = new NewGameComponent(APP_WIDTH/3, APP_HEIGHT*2/3)
        this.joinGame = new JoinGameComponent(APP_WIDTH*2/3, APP_HEIGHT*2/3)

        addSocketEvent(MSG_TYPES.GAME_START_PLAYER_NOT_PRESENT, () => {
            this.joinGame.setJoinGameResponseTextBoxMessage("Joining not allowed: game has started")
        })
    }

    startRendering() {
        this.spriteHandler.registerContainer(this.title)
        this.spriteHandler.registerContainer(this.newGame)
        this.spriteHandler.registerContainer(this.joinGame)

        // Begin the rendering loop
        this.spriteHandler.render()
    }

    stopRendering() {
        this.spriteHandler.clear()
    }
}
