import { SpriteHandler } from "../sprite_handler.js"
import { GraphicButton } from "../ui/button.js"
import { GraphicBackground } from "../ui/background.js"
import { MapComponent } from "../components/map.js"
import { GameSetting } from "../lobby_components/gameSetting.js"
import { Player } from "../lobby_components/player.js"
import { APP_HEIGHT, APP_WIDTH, LOBBY_WINDOW_HEIGHT, LOBBY_WINDOW_WIDTH, MAP_WIDTH } from "../constants.js"
import { getGameID } from "../state.js"
import { getPositionWithinEquallySpacedObjects } from "../tools.js"

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

        let xMargin = 25
        let yMargin = 20

        this.background = new GraphicBackground(LOBBY_WINDOW_WIDTH, LOBBY_WINDOW_HEIGHT, APP_WIDTH/2, APP_HEIGHT/2)

        this.lobbyTitleText = new PIXI.Text("Lobby");
        this.lobbyTitleText.x = popupBoundaryLeft + xMargin;
        this.lobbyTitleText.y = popupBoundaryTop + yMargin;

        this.gameIDText = new PIXI.Text("Game code: " + getGameID());
        this.gameIDText.anchor.set(1, 0)
        this.gameIDText.x = popupBoundaryRight - xMargin;
        this.gameIDText.y = popupBoundaryTop + yMargin;

        let mapScale = 420/MAP_WIDTH
        this.map = new MapComponent(this.spriteHandler, mapScale)
        this.map.container.x = popupBoundaryLeft + xMargin
        this.map.container.y = popupBoundaryTop + 80
        this.regenerateMapButton = new GraphicButton(200, 25, this.map.container.x+this.map.width, this.map.container.y - 5, "Regenerate Map", 20, 0x448877, 1, 1)

        let optionWidth = 350
        let optionFontSize = 25
        let optionGap = 25
        this.mapPathSetting = new GameSetting(popupBoundaryRight - xMargin, this.map.container.y + 20, "Map type", ["Straight", "Winding"], 1, optionFontSize, optionWidth, 1, 0)
        this.roundsSetting = new GameSetting(popupBoundaryRight - xMargin, this.mapPathSetting.y + this.mapPathSetting.getLocalBounds().height + optionGap, "Rounds", [25, 50, 75, 100], 1, optionFontSize, optionWidth, 1, 0)
        this.difficultySetting = new GameSetting(popupBoundaryRight - xMargin, this.roundsSetting.y + this.roundsSetting.getLocalBounds().height + optionGap, "Difficulty", ["Easy", "Medium", "Hard", "Very Hard"], 1, optionFontSize, optionWidth, 1, 0)

        let playerSideLen = popupBoundaryBottom - this.map.container.y - this.map.height - yMargin - 20
        let playerMargin = 10
        this.player1 = new Player(1, playerSideLen, playerSideLen, popupBoundaryLeft + xMargin, popupBoundaryBottom-yMargin, 0, 1)
        this.player2 = new Player(2, playerSideLen, playerSideLen, this.player1.x + playerSideLen + playerMargin, this.player1.y, 0, 1)
        this.player3 = new Player(3, playerSideLen, playerSideLen, this.player2.x + playerSideLen + playerMargin, this.player1.y, 0, 1)
        this.player4 = new Player(4, playerSideLen, playerSideLen, this.player3.x + playerSideLen + playerMargin, this.player1.y, 0, 1)

        let startButtonWidth = 180
        let startButtonHeight = 100
        let startButtonStartX = this.player4.x + playerSideLen
        let startButtonStartY = this.player4.y - playerSideLen
        this.startButton = new GraphicButton(
            startButtonWidth,
            startButtonHeight,
            startButtonStartX + getPositionWithinEquallySpacedObjects(1, 1, startButtonWidth, popupBoundaryRight - startButtonStartX),
            startButtonStartY + getPositionWithinEquallySpacedObjects(1, 1, startButtonHeight, playerSideLen),
            "Start Game", 45, 0xAA88DD, 0.5, 0.5)
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
        this.spriteHandler.registerContainer(this.lobbyTitleText)

        this.map.registerContainer()
        this.spriteHandler.registerContainer(this.regenerateMapButton);
        this.spriteHandler.registerContainer(this.mapPathSetting);
        this.spriteHandler.registerContainer(this.roundsSetting);
        this.spriteHandler.registerContainer(this.difficultySetting);
        this.spriteHandler.registerContainer(this.player1)
        this.spriteHandler.registerContainer(this.player2)
        this.spriteHandler.registerContainer(this.player3)
        this.spriteHandler.registerContainer(this.player4)

        // Begin the rendering loop
        this.spriteHandler.render()
    }

    stopRendering() {
        this.spriteHandler.stopRender()
    }
}
