import { SpriteHandler } from "../sprite_handler.js"
import { GraphicButton } from "../ui/button.js"
import { GraphicBackground } from "../ui/background.js"
import { MapComponent } from "../components/map.js"
import { APP_HEIGHT, APP_WIDTH, LOBBY_WINDOW_HEIGHT, LOBBY_WINDOW_WIDTH, MAP_WIDTH } from "../constants.js"
import { getGameID } from "../state.js"

/**
 * This class sets up what will appear in the main menu view.
 */
export class LobbyRenderer {
    constructor() {
        this.spriteHandler = new SpriteHandler()

        let popupBoundaryLeft = APP_WIDTH/2 - LOBBY_WINDOW_WIDTH/2
        let popupBoundaryTop = APP_HEIGHT/2 - LOBBY_WINDOW_HEIGHT/2
        let popupBoundaryRight = APP_WIDTH/2 + LOBBY_WINDOW_WIDTH/2
        let popupBoundaryBottom = APP_HEIGHT/2 + LOBBY_WINDOW_HEIGHT/2

        this.startButton = new GraphicButton(180, 100, popupBoundaryRight-(180/2)-20, popupBoundaryBottom-(100/2)-20, "Start Game", 45)
        this.background = new GraphicBackground(LOBBY_WINDOW_WIDTH, LOBBY_WINDOW_HEIGHT, APP_WIDTH/2, APP_HEIGHT/2)
        this.gameIDText = new PIXI.Text("Game code: " + getGameID());
        this.gameIDText.x = popupBoundaryLeft + 30;
        this.gameIDText.y = popupBoundaryTop + 20;

        let mapScale = 450/MAP_WIDTH
        this.map = new MapComponent(this.spriteHandler, mapScale)
        this.map.container.x = popupBoundaryLeft + 30
        this.map.container.y = popupBoundaryTop + 100

        this.map.container.calculateBounds()

        this.regenerateMapButton = new GraphicButton(200, 30, this.map.container.x+this.map.width, this.map.container.y - 5, "Regenerate Map", 20, 0x448877, 1, 1)

    }

    loadAssets() {
        return new Promise((resolve)=>{
            // Load sprite assets
            PIXI.Loader.shared
                .add("client/img/map_spritesheet.png")
                .load(resolve)
        })
    }

    startRendering() {
        this.spriteHandler.registerContainer(this.background)
        this.spriteHandler.registerContainer(this.startButton)
        this.spriteHandler.registerContainer(this.gameIDText)
        this.map.registerContainer()
        this.spriteHandler.registerContainer(this.regenerateMapButton);

        // Begin the rendering loop
        this.spriteHandler.render()
    }

    stopRendering() {
        this.spriteHandler.stopRender()
    }
}
