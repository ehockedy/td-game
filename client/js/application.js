import { GameRenderer} from "./views/game.js"
import { MainMenuRenderer } from "./views/main_menu.js"
import { LobbyRenderer } from "./views/lobby.js"
import { addSocketEvent, sendMessage } from "./networking.js"
import { SpriteHandler } from "./sprite_handler.js"
import { generateClientConfig } from "./constants.js"

/**
 * Main class that is created when client connects to the server
 */
export class Application {
    constructor(config) {
        this.clientConfig = generateClientConfig(config)

        // This holds the PIXI application and all the sprites
        this.spriteHandler = new SpriteHandler(this.clientConfig.APP_WIDTH, this.clientConfig.APP_HEIGHT)

        // View is the scene that user is currently on
        this.view = new MainMenuRenderer(this.spriteHandler, this.clientConfig)
        this.view.startRendering()

        addSocketEvent("client/view/lobby", ()=>{
            this.view.stopRendering()
            this.view = new LobbyRenderer(this.spriteHandler, this.clientConfig)
            this.view.startRendering()
            sendMessage("server/map/get")
        })

        addSocketEvent("client/view/game", ()=>{
            this.view.stopRendering()
            this.view = new GameRenderer(this.spriteHandler, this.clientConfig)
            this.view.loadAssets().then(()=>{
                this.view.startRendering()
                sendMessage("server/map/get")  // This is required if the user joins an already started game
            })
        })
    }
}