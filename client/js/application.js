import { GameRenderer} from "./views/game.js"
import { MainMenuRenderer } from "./views/main_menu.js"
import { LobbyRenderer } from "./views/lobby.js"
import { SpriteHandler } from "./sprite_handler.js"
import { generateClientConfig } from "./constants.js"

/**
 * Main class that is created when client connects to the server
 */
export class Application {
    constructor(config, socket) {
        let clientConfig = generateClientConfig(config)

        // This holds the PIXI application and all the sprites
        let spriteHandler = new SpriteHandler(clientConfig.APP_WIDTH, clientConfig.APP_HEIGHT)

        // View is the scene that user is currently on
        let view = new MainMenuRenderer(socket, spriteHandler, clientConfig)
        view.startRendering()

        socket.on("client/view/lobby", ()=>{
            view.stopRendering()
            view = new LobbyRenderer(socket, spriteHandler, clientConfig)
            view.startRendering()
        })

        socket.on("client/view/game", ()=>{
            view.stopRendering()
            view = new GameRenderer(socket, spriteHandler, clientConfig)
            view.loadAssets().then(()=>{
                view.startRendering()
            })
        })
    }
}