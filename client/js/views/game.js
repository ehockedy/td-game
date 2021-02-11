import { MapComponent } from "../components/game/map.js"
import { TowerMenu } from "../components/game/towerMenu.js"
import { PlayersToolbar } from "../components/game/playersToolbar.js"
import { TowersComponent } from "../components/game/towersComponent.js"
import { EnemiesComponent } from "../components/game/enemiesComponent.js"
import { BulletsComponent } from "../components/game/bulletsComponent.js"
import { GraphicButton } from "../components/ui_common/button.js"
import { OnScreenMessage } from "../components/ui_common/onScreenMessages.js"
import { addSocketEvent, MSG_TYPES, sendMessage } from "../networking.js"
import { setBoard } from "../state.js"

/**
 * This class sets up what will appear in the game view.
 * It also takes updates from the server and passes the update data to the relevant components
 */
export class GameRenderer {
    constructor(spriteHandler, config) {
        this.spriteHandler = spriteHandler
        this.map = new MapComponent(config.MAP_COLS, config.MAP_ROWS, config.SPRITE_SIZE_MAP)
        this.tm = new TowerMenu(this.spriteHandler, config.TOWER_MENU_WIDTH, config.TOWER_MENU_HEIGHT, config.MAP_WIDTH - config.TOWER_MENU_WIDTH, 0, config.MAP_WIDTH, config.MAP_HEIGHT, config.SPRITE_SIZE_MAP)
        this.ut = new PlayersToolbar(config.PLAYER_TOOLBAR_WIDTH, config.PLAYER_TOOLBAR_HEIGHT, 0, config.MAP_HEIGHT)
        this.tc = new TowersComponent(this.spriteHandler, config.SPRITE_SIZE_MAP)
        this.ec = new EnemiesComponent(config.SPRITE_SIZE_TOWER, config.SPRITE_SIZE_MAP)
        this.bc = new BulletsComponent(config.SPRITE_SIZE_TOWER, config.SPRITE_SIZE_MAP)
        this.perRoundUpdateText = new OnScreenMessage(config.MAP_WIDTH/2, config.MAP_HEIGHT/2, "Round 1", 30)

        this.startRoundButton = new GraphicButton(
            150, 80, // width, height
            config.APP_WIDTH, config.APP_HEIGHT, // x, y
            "Start Round",
            80*0.5, 0x448877, // font size, colour
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
        })

        addSocketEvent(MSG_TYPES.SERVER_SET_GAME_BOARD, (grid) => {
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
        return Promise.all([
            this.tc.loadData(),
            this.ec.loadData(),
            this.tm.loadData(),
            this.bc.loadData()
        ])
    }

    startRendering() {
        // Register containers with the sprite layer
        // The order here is the order they are rendered on the map
        this.spriteHandler.registerContainer(this.map)
        this.spriteHandler.registerContainer(this.ec)
        this.spriteHandler.registerContainer(this.ut)
        this.spriteHandler.registerContainer(this.startRoundButton)
        this.spriteHandler.registerDynamicContainer(this.tc)
        this.spriteHandler.registerDynamicContainer(this.tm)
        this.spriteHandler.registerContainer(this.bc)
        this.spriteHandler.registerContainer(this.perRoundUpdateText)

        this.spriteHandler.registerContainer(this.debugExportGameButton)
        this.spriteHandler.registerContainer(this.debugImportGameButton)


        // Set up links between components that need them
        this.tm.setTowerFactoryLink(this.tc)

        this.tm.addTowers()

        // Begin the rendering loop
        this.spriteHandler.render()

        this.perRoundUpdateText.fadeInThenOut(1000, 2000)
    }

    update(serverUpdate) {
        this.tc.update(serverUpdate["towers"])
        this.map.update(serverUpdate["towers"])
        this.tm.update(serverUpdate["players"])
        this.ec.update(serverUpdate["enemies"])
        this.bc.update(serverUpdate["bullets"])
        this.ut.update(serverUpdate["players"])
        //this.git.update(serverUpdate["worldState"])
    }

    addPlayer(playerInfo) {
        this.ut.addPlayer(playerInfo)
    }
}
