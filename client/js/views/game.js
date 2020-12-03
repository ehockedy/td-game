import { MapComponent } from "../components/game/map.js"
import { TowerMenu } from "../components/game/towerMenu.js"
import { InfoToolbar } from "../components/game/infoToolbar.js"
import { PlayersToolbar } from "../components/game/playersToolbar.js"
import { TowersComponent } from "../components/game/towersComponent.js"
import { EnemiesComponent } from "../components/game/enemiesComponent.js"
import { BulletsComponent } from "../components/game/bulletsComponent.js"
import { GraphicButton } from "../components/ui_common/button.js"
import { OnScreenMessage } from "../components/ui_common/onScreenMessages.js"
import { GameInfoToolbar } from "../components/game/gameInfoToolbar.js"
import { RIGHT_TOOLBAR_WIDTH, TOWER_INFO_MENU_HEIGHT, TOWER_MENU_HEIGHT, GAME_STATS_MENU_HEIGHT, MAP_WIDTH, MAP_HEIGHT, BOTTOM_TOOLBAR_HEIGHT, APP_WIDTH, APP_HEIGHT } from "../constants.js"
import { addSocketEvent, MSG_TYPES, sendMessage } from "../networking.js"
import { setBoard } from "../state.js"

/**
 * This class sets up what will appear in the game view.
 * It also takes updates from the server and passes the update data to the relevant components
 */
export class GameRenderer {
    constructor(spriteHandler) {
        this.spriteHandler = spriteHandler
        this.map = new MapComponent(this.spriteHandler)
        this.tm = new TowerMenu(this.spriteHandler, RIGHT_TOOLBAR_WIDTH, TOWER_MENU_HEIGHT, MAP_WIDTH, 0)
        this.it = new InfoToolbar(this.spriteHandler, RIGHT_TOOLBAR_WIDTH, TOWER_INFO_MENU_HEIGHT, MAP_WIDTH, TOWER_MENU_HEIGHT)
        this.git = new GameInfoToolbar(this.spriteHandler, RIGHT_TOOLBAR_WIDTH, GAME_STATS_MENU_HEIGHT, MAP_WIDTH, TOWER_MENU_HEIGHT+TOWER_INFO_MENU_HEIGHT)
        this.ut = new PlayersToolbar(this.spriteHandler, MAP_WIDTH, BOTTOM_TOOLBAR_HEIGHT, 0, MAP_HEIGHT)
        this.tc = new TowersComponent(this.spriteHandler)
        this.ec = new EnemiesComponent(this.spriteHandler)
        this.bc = new BulletsComponent(this.spriteHandler)
        this.perRoundUpdateText = new OnScreenMessage(MAP_WIDTH/2, MAP_HEIGHT/2, "Round 1", 30)

        this.startRoundButton = new GraphicButton(
            RIGHT_TOOLBAR_WIDTH, BOTTOM_TOOLBAR_HEIGHT, // width, height
            APP_WIDTH, APP_HEIGHT, // x, y
            "Start Round",
            40, 0x448877, // font size, colour
            1, 1) // anchor
        this.startRoundButton.on("click", ()=>{sendMessage(MSG_TYPES.ROUND_START)})
        this.startRoundButton.on("tap", ()=>{sendMessage(MSG_TYPES.ROUND_START)})

        // **** DEBUG BUTTON TO SAVE/LOAD TOWERS ***
        this.debugExportGameButton = new GraphicButton(
            32, 32, // width, height
            0, 0, // x, y
            "EXPORT",
            8, 0x448877, // font size, colour
            0, 0) // anchor
        this.debugExportGameButton.on("click", ()=>{sendMessage(MSG_TYPES.DEBUG_EXPORT_GAME_STATE)})
        this.debugExportGameButton.on("tap", ()=>{sendMessage(MSG_TYPES.DEBUG_EXPORT_GAME_STATE)})

        this.debugImportGameButton = new GraphicButton(
            32, 32, // width, height
            32, 0, // x, y
            "IMPORT",
            8, 0x887744, // font size, colour
            0, 0) // anchor
        this.debugImportGameButton.on("click", ()=>{sendMessage(MSG_TYPES.DEBUG_IMPORT_GAME_STATE)})
        this.debugImportGameButton.on("tap", ()=>{sendMessage(MSG_TYPES.DEBUG_IMPORT_GAME_STATE)})
        // **** END OF DEBUG ****

        addSocketEvent(MSG_TYPES.SERVER_UPDATE_GAME_STATE, (gameUpdate) => {
            this.update(gameUpdate)
        })

        addSocketEvent(MSG_TYPES.ADD_PLAYER, (gameUpdate) => {
            this.addPlayer(gameUpdate)
        })

        addSocketEvent(MSG_TYPES.ADD_PLAYER_SELF, (gameUpdate) => {
            this.addPlayer(gameUpdate)
        })

        addSocketEvent(MSG_TYPES.REMOVE_PLAYER, (gameUpdate) => {
            this.addPlayer(gameUpdate)
        })

        addSocketEvent(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, (grid) => {
            setBoard(grid);
            this.map.constructMap()
        })

        addSocketEvent(MSG_TYPES.PLAYER_READY, (playerData) => {
            this.ut.setPlayerReady(playerData.playerID)
        })

        addSocketEvent(MSG_TYPES.ROUND_START, () => {
            this.tm.stopInteraction()
            this.startRoundButton.interactive = false // TODO this button should also disappear - weird to have it during the round
            this.startRoundButton.buttonMode = false
        })

        addSocketEvent(MSG_TYPES.ROUND_END, (nextRoundInfo) => {
            let timePerFade = 1000
            let timeBetweenFade = 2000
            let timeBetweenMessages = 2000
            this.perRoundUpdateText.updateText("Round Complete")
            this.perRoundUpdateText.fadeInThenOut(timePerFade, timeBetweenFade)
            setTimeout(()=>{
                this.perRoundUpdateText.updateText("Round " + nextRoundInfo.roundNumber.toString())
                this.perRoundUpdateText.fadeInThenOut(timePerFade, timeBetweenFade)
            }, timePerFade*2 + timeBetweenMessages)
            this.ut.unsetAllPlayers()
            this.tm.startInteraction()
            this.startRoundButton.interactive = true
            this.startRoundButton.buttonMode = true
        })
    }

    loadAssets() {
        let _tc = this.tc
        let _it = this.it
        let _ec = this.ec
        return Promise.all([_tc.loadData(), _it.loadData(), _ec.loadData()])
    }

    startRendering() {
        // Register containers with the sprite layer
        // The order here is the order they are rendered on the map
        this.map.registerContainer()
        this.ec.registerContainer()
        this.tc.registerRangeSpriteContainer()
        this.tm.registerRangeSpriteContainer()
        this.tm.registerContainer()
        this.it.registerContainer()
        this.git.registerContainer()
        this.spriteHandler.registerContainer(this.startRoundButton)
        this.ut.registerContainer()
        this.tc.registerContainer()
        this.bc.registerContainer()
        this.spriteHandler.registerContainer(this.perRoundUpdateText)

        this.spriteHandler.registerContainer(this.debugExportGameButton)
        this.spriteHandler.registerContainer(this.debugImportGameButton)


        // Set up links between components that need them
        this.tc.setInfoToolbarLink(this.it)
        this.tm.setInfoToolbarLink(this.it)
        this.tm.setTowerFactoryLink(this.tc)

        this.tm.addTowers()

        // Begin the rendering loop
        this.spriteHandler.render()

        this.perRoundUpdateText.fadeInThenOut(1000, 2000)
    }

    update(serverUpdate) {
        this.tc.update(serverUpdate["towers"])
        this.ec.update(serverUpdate["enemies"])
        this.bc.update(serverUpdate["bullets"])
        this.ut.update(serverUpdate["players"])
        this.it.update()
        this.git.update(serverUpdate["worldState"])
    }

    addPlayer(playerInfo) {
        this.ut.addPlayer(playerInfo)
    }
}
