import { SpriteHandler } from "../sprite_handler.js"
import { GraphicButton } from "../ui/button.js"
import { GraphicBackground } from "../ui/background.js"
import { APP_HEIGHT, APP_WIDTH, LOBBY_WINDOW_HEIGHT, LOBBY_WINDOW_WIDTH } from "../constants.js"

/**
 * This class sets up what will appear in the main menu view.
 */
export class LobbyRenderer {
    constructor() {
        this.spriteHandler = new SpriteHandler()

        let popupBoundaryRight = APP_WIDTH/2 + LOBBY_WINDOW_WIDTH/2
        let popupBoundaryBottom = APP_HEIGHT/2 + LOBBY_WINDOW_HEIGHT/2
        this.startButton = new GraphicButton(180, 100, popupBoundaryRight-(180/2)-20, popupBoundaryBottom-(100/2)-20, "Start Game", 45)
        this.background = new GraphicBackground(LOBBY_WINDOW_WIDTH, LOBBY_WINDOW_HEIGHT, APP_WIDTH/2, APP_HEIGHT/2)
    }

    startRendering() {
        this.spriteHandler.registerContainer(this.background)
        this.spriteHandler.registerContainer(this.startButton)

        // Begin the rendering loop
        this.spriteHandler.render()
    }

    stopRendering() {
        this.spriteHandler.stopRender()
    }
}
