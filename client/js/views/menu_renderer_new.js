import { SpriteHandler } from "../sprite_handler.js"
import { MenuTitle } from "../main_menu_components/title.js"
import { APP_HEIGHT, APP_WIDTH } from "../constants.js"

/**
 * This class sets up what will appear in the main menu view.
 */
export class MainMenuRenderer {
    constructor() {
        this.spriteHandler = new SpriteHandler()
        this.title = new MenuTitle(this.spriteHandler, APP_WIDTH/2, APP_HEIGHT/3)
    }

    startRendering() {
        this.title.registerContainer()
        
        // Begin the rendering loop
        this.spriteHandler.render()
    }

    stopRendering() {
        this.spriteHandler.stopRender()
    }
}