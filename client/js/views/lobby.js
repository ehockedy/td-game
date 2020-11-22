import { SpriteHandler } from "../sprite_handler.js"
import { GraphicButton } from "../ui/button.js"
import { GraphicBackground } from "../ui/background.js"
import { MapComponent } from "../components/map.js"
import { GameSetting } from "../lobby_components/gameSetting.js"
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
        this.regenerateMapButton = new GraphicButton(200, 30, this.map.container.x+this.map.width, this.map.container.y - 5, "Regenerate Map", 20, 0x448877, 1, 1)

        let optionWidth = 350
        let optionFontSize = 25
        let optionGap = 15
        this.mapPathSetting = new GameSetting(this.map.container.x+this.map.width+40, this.map.container.y + 20, "Map type", ["Straight", "Winding"], 1, optionFontSize, optionWidth)
        this.roundsSetting = new GameSetting(this.map.container.x+this.map.width+40, this.mapPathSetting.y + this.mapPathSetting.getLocalBounds().height + optionGap, "Rounds", [25, 50, 75, 100], 1, optionFontSize, optionWidth)
        this.difficultySetting = new GameSetting(this.map.container.x+this.map.width+40, this.roundsSetting.y + this.roundsSetting.getLocalBounds().height + optionGap, "Difficulty", ["Easy", "Medium", "Hard", "Very Hard"], 1, optionFontSize, optionWidth)

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
        this.spriteHandler.registerContainer(this.mapPathSetting);
        this.spriteHandler.registerContainer(this.roundsSetting);
        this.spriteHandler.registerContainer(this.difficultySetting);


        // Begin the rendering loop
        this.spriteHandler.render()
    }

    stopRendering() {
        this.spriteHandler.stopRender()
    }
}
