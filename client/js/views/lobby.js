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
 * This class sets up what will appear in the lobby view.
 * All components positions are defined relative to each other and the boundaries of the menu.
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

        // Game ID - this is the code that players can use to join this game
        this.gameIDText = new PIXI.Text("Game code: " + getGameID());
        this.gameIDText.anchor.set(1, 0)
        this.gameIDText.x = popupBoundaryRight - xMargin;
        this.gameIDText.y = popupBoundaryTop + yMargin;

        // Map preview - the primary player (1) can regenrate the map that will be used in the game. The setting will affect the map generated
        let mapScale = 420/MAP_WIDTH // Scale the map down by this much
        this.map = new MapComponent(this.spriteHandler, mapScale)
        this.map.container.x = popupBoundaryLeft + xMargin
        this.map.container.y = popupBoundaryTop + 80
        this.regenerateMapButton = new GraphicButton(
            200, 25, // width, height
            this.map.container.x+this.map.width, this.map.container.y - 5, // x, y
            "Regenerate Map",
            20, 0x448877, // font size, colour
            1, 1) // anchor

        // Settings for the game
        let optionWidth = 350
        let optionFontSize = 25
        let optionGap = 25
        this.mapPathSetting = new GameSetting( // The structure of the map that will be regenerated
            popupBoundaryRight - xMargin, this.map.container.y + 20, // x, y
            "Map type", ["Straight", "Winding"], 1, // Setting values
            optionFontSize, optionWidth, // font size and width (px)
            1, 0) // Anchor
        this.roundsSetting = new GameSetting( // The number of rounds to play to beat the game
            popupBoundaryRight - xMargin, this.mapPathSetting.y + this.mapPathSetting.getLocalBounds().height + optionGap,
            "Rounds", [25, 50, 75, 100], 1,
            optionFontSize, optionWidth,
            1, 0)
        this.difficultySetting = new GameSetting( // The difficulty of the enemies, and the cost of the towers
            popupBoundaryRight - xMargin, this.roundsSetting.y + this.roundsSetting.getLocalBounds().height + optionGap,
            "Difficulty", ["Easy", "Medium", "Hard", "Very Hard"], 1,
            optionFontSize, optionWidth,
            1, 0)

        // Lobby members - player that clicked new game is player 1. They can change the game options. When another player joins they fill in the second slot and so on
        let playerSideLen = popupBoundaryBottom - this.map.container.y - this.map.height - yMargin - 20
        let playerMargin = 15
        let playersY = popupBoundaryBottom-yMargin
        let playersX = popupBoundaryLeft + xMargin
        let numPlayers = 4 // TODO make this and all other const
        this.players = []
        for (let idx = 1; idx <=numPlayers; idx++) {
            // Note that index starts at 1 (since don't want player 0)
            this.players.push(new Player(idx, playerSideLen, playerSideLen, playersX + (idx-1)*(playerSideLen + playerMargin), playersY, 0, 1))
        }

        // Start game button - takes the game setting chsoe and begins the game for all present players
        let startButtonWidth = 180
        let startButtonHeight = 100
        let startButtonStartX = this.players[numPlayers-1].x + playerSideLen
        let startButtonStartY = this.players[numPlayers-1].y - playerSideLen
        this.startButton = new GraphicButton(
            startButtonWidth, startButtonHeight,
            startButtonStartX + getPositionWithinEquallySpacedObjects(1, 1, startButtonWidth, popupBoundaryRight - startButtonStartX),
            startButtonStartY + getPositionWithinEquallySpacedObjects(1, 1, startButtonHeight, playerSideLen),
            "Start Game",
            45, 0xAA88DD, // font size, colour
            0.5, 0.5) // anchor
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
        this.players.forEach((player) => {
            this.spriteHandler.registerContainer(player)
        })

        // Begin the rendering loop
        this.spriteHandler.render()
    }

    stopRendering() {
        this.spriteHandler.stopRender()
    }

    addPlayer(playerData) {
        console.log(playerData)
        this.players[playerData.index].setPlayer(playerData)
    }

    removePlayer(playerData) {
        this.players[playerData.index].clearPlayer()
    }
}
