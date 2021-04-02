import { GraphicButton } from "../components/ui_common/button.js"
import { GraphicBackground } from "../components/ui_common/background.js"
import { MapComponent } from "../components/game/map.js"
import { GameSetting } from "../components/lobby/gameSetting.js"
import { Player } from "../components/lobby/player.js"
import { getPositionWithinEquallySpacedObjects } from "../tools.js"
import { setUserID, getGameID } from "../state.js"

/**
 * This class sets up what will appear in the lobby view.
 * All components positions are defined relative to each other and the boundaries of the menu.
 */
export class LobbyRenderer {
    constructor(socket, spriteHandler, config) {
        this.socket = socket
        this.spriteHandler = spriteHandler

        let popupBoundaryLeft = config.APP_WIDTH/2 - config.LOBBY_WINDOW_WIDTH/2
        let popupBoundaryTop = config.APP_HEIGHT/2 - config.LOBBY_WINDOW_HEIGHT/2
        let popupBoundaryRight = config.APP_WIDTH/2 + config.LOBBY_WINDOW_WIDTH/2
        let popupBoundaryBottom = config.APP_HEIGHT/2 + config.LOBBY_WINDOW_HEIGHT/2

        let xMargin = 25
        let yMargin = 20

        this.background = new GraphicBackground(config.LOBBY_WINDOW_WIDTH, config.LOBBY_WINDOW_HEIGHT, config.APP_WIDTH/2, config.APP_HEIGHT/2)

        this.lobbyTitleText = new PIXI.Text("Lobby");
        this.lobbyTitleText.x = popupBoundaryLeft + xMargin;
        this.lobbyTitleText.y = popupBoundaryTop + yMargin;

        // Game ID - this is the code that players can use to join this game
        this.gameIDText = new PIXI.Text("Game code: " + getGameID());
        this.gameIDText.anchor.set(1, 0)
        this.gameIDText.x = popupBoundaryRight - xMargin;
        this.gameIDText.y = popupBoundaryTop + yMargin;

        // Map preview - the primary player (1) can regenrate the map that will be used in the game. The setting will affect the map generated
        let mapScale = 420/config.MAP_WIDTH // Scale the map down by this much
        this.map = new MapComponent(config.MAP_COLS, config.MAP_ROWS, config.SPRITE_SIZE_MAP, mapScale)
        this.map.x = popupBoundaryLeft + xMargin
        this.map.y = popupBoundaryTop + 80

        // Settings for the game
        let optionWidth = 350
        let optionFontSize = 25
        let optionGap = 25
        this.mapPathSetting = new GameSetting( // The structure of the map that will be regenerated
            popupBoundaryRight - xMargin, this.map.y + 20, // x, y
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

        this.seedInput = new PIXI.TextInput({
            input: {
                fontSize: '25px',
                padding: '2px',
                width: '350px',
                color: '#26272E'
            },
            box: {
                default: {fill: 0xE8E9F3, stroke: {color: 0xCBCEE0, width: 1}},
                focused: {fill: 0xE1E3EE, stroke: {color: 0xABAFC6, width: 1}},
                disabled: {fill: 0xDBDBDB}
            }
        })

        this.seedInput.placeholder = 'Game seed...'
        this.seedInput.x = this.map.x + 420 + 20
        this.seedInput.y = this.roundsSetting.y + this.difficultySetting.getLocalBounds().height + optionGap + 45

        this.regenerateMapButton = new GraphicButton(
            200, 25, // width, height
            this.map.x+this.map.getWidth(), this.map.y - 5, // x, y
            "Regenerate Map",
            20, 0x448877, // font size, colour
            1, 1) // anchor

        let regenrateMapFn = () => {
            socket.emit("server/map/regenerate", this.seedInput.text)
        }
        this.regenerateMapButton.on("click", () => {regenrateMapFn()})
        this.regenerateMapButton.on("tap", () => {regenrateMapFn()})

        // Lobby members - player that clicked new game is player 1. They can change the game options. When another player joins they fill in the second slot and so on
        let playerSideLen = 300 //popupBoundaryBottom - this.map.y - this.map.getHeight() - yMargin - 20
        let playerMargin = 15
        let playersY = popupBoundaryBottom - yMargin
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
        function startGameReqFn() { socket.emit("server/game/start") }
        this.startButton.on('click', ()=>{startGameReqFn()})
        this.startButton.on('tap', ()=>{startGameReqFn()})

        // Events sent from server
        socket.on("client/map/set", (grid) => {
            this.map.setGridValues(grid);
            this.map.constructMap()
        })

        socket.on("client/player/add", (data) => {
            this.addPlayer(data)
        })

        socket.on("client/player/addSelf", (data) => {
            this.addPlayer(data)
            setUserID(data.playerID)
        })

        socket.on("client/player/remove", (data) => {
            this.removePlayer(data)
        })
    }

    startRendering() {
        this.socket.emit("server/map/get", (map) => {
            this.map.setGridValues(map);
            this.map.constructMap()
        })
        this.spriteHandler.registerContainer(this.background)
        this.spriteHandler.registerContainer(this.startButton)
        this.spriteHandler.registerContainer(this.gameIDText)
        this.spriteHandler.registerContainer(this.lobbyTitleText)
        this.spriteHandler.registerContainer(this.map)
        this.spriteHandler.registerContainer(this.regenerateMapButton);
        this.spriteHandler.registerContainer(this.mapPathSetting);
        this.spriteHandler.registerContainer(this.roundsSetting);
        this.spriteHandler.registerContainer(this.difficultySetting);
        this.spriteHandler.registerContainer(this.seedInput);
        this.players.forEach((player) => {
            this.spriteHandler.registerContainer(player)
        })

        // Begin the rendering loop
        this.spriteHandler.render()
    }

    stopRendering() {
        this.spriteHandler.clear()
        // TODO remove socket events
    }

    addPlayer(playerData) {
        this.players[playerData.index].setPlayer(playerData)
    }

    removePlayer(playerData) {
        this.players[playerData.index].clearPlayer()
    }
}
