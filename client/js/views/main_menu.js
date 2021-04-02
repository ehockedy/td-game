import { MenuTitle } from "../components/main_menu/title.js"
import { NewGameComponent } from "../components/main_menu/newGameComponent.js"
import { JoinGameComponent } from "../components/main_menu/joinGameComponent.js"
import { addSocketEvent } from "../networking.js"

/**
 * This class sets up what will appear in the main menu view.
 */
export class MainMenuRenderer {
    constructor(spriteHandler, config) {
        this.spriteHandler = spriteHandler
        this.title = new MenuTitle(config.APP_WIDTH/2, config.APP_HEIGHT/3)
        this.newGame = new NewGameComponent(config.APP_WIDTH/3, config.APP_HEIGHT*2/3, config.GAME_CODE_LEN)
        this.joinGame = new JoinGameComponent(config.APP_WIDTH*2/3, config.APP_HEIGHT*2/3, config.APP_WIDTH, config.APP_HEIGHT)

        addSocketEvent("client/player/notFound", () => {
            this.joinGame.setJoinGameResponseTextBoxMessage("Joining not allowed: game has started")
        })
    }

    startRendering() {
        this.spriteHandler.registerDynamicContainer(this.title)
        this.spriteHandler.registerContainer(this.newGame)
        this.spriteHandler.registerContainer(this.joinGame)

        // Begin the rendering loop
        this.spriteHandler.render()
    }

    stopRendering() {
        this.spriteHandler.clear()
    }
}
