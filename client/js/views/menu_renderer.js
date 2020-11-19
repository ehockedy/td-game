import { SpriteHandler } from "../sprite_handler.js"
import { MenuTitle } from "../main_menu_components/title.js"
import { NewGameComponent } from "../main_menu_components/newGameComponent.js"
import { JoinGameComponent } from "../main_menu_components/joinGameComponent.js"
import { APP_HEIGHT, APP_WIDTH } from "../constants.js"

/**
 * This class sets up what will appear in the main menu view.
 */
export class MainMenuRenderer {
    constructor() {
        this.spriteHandler = new SpriteHandler()
        this.title = new MenuTitle(this.spriteHandler, APP_WIDTH/2, APP_HEIGHT/3)
        this.newGame = new NewGameComponent(this.spriteHandler, APP_WIDTH/3, APP_HEIGHT*2/3)
        this.joinGame = new JoinGameComponent(this.spriteHandler, APP_WIDTH*2/3, APP_HEIGHT*2/3)
    }

    startRendering() {
        this.title.registerContainer()
        this.newGame.registerContainer()
        this.joinGame.registerContainer()

        // Begin the rendering loop
        this.spriteHandler.render()
    }

    stopRendering() {
        this.spriteHandler.stopRender()
    }
}
