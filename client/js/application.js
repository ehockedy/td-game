import { GameRenderer} from "./views/game.js"
import { MainMenuRenderer } from "./views/main_menu.js"
import { LobbyRenderer } from "./views/lobby.js"
import { addSocketEvent, MSG_TYPES, sendMessage } from "./networking.js"
import { SpriteHandler } from "./sprite_handler.js"

/**
 * Main class that is created when client connects to the server
 */
export class Application {
    constructor() {
        // This holds the PIXI application and all the sprites
        this.spriteHandler = new SpriteHandler()

        // View is the scene that user is currently on
        this.view = new MainMenuRenderer(this.spriteHandler)
        this.view.startRendering()

        addSocketEvent(MSG_TYPES.LOBBY_START, ()=>{
            this.view.stopRendering()
            this.view = new LobbyRenderer(this.spriteHandler)
            this.view.loadAssets().then(()=>{
                this.view.startRendering()
                sendMessage(MSG_TYPES.LOBBY_START) // Tell the server the client is ready
            })
        })
    }
}