import { MapComponent } from "../components/game/map.js"
import { TowerMenu } from "../components/game/towerMenu.js"
import { InteractiveGameSpace } from "../components/game/interactiveGameSpace.js"
import { PlayersToolbar } from "../components/game/playersToolbar.js"
import { TowersComponent } from "../components/game/towersComponent.js"
import { EnemiesComponent } from "../components/game/enemiesComponent.js"
import { BulletsComponent } from "../components/game/bulletsComponent.js"
import { GraphicButton } from "../components/ui_common/button.js"
import { StartRoundButton } from "../components/game/ui/startRoundButton.js"
import { OnScreenMessage } from "../components/ui_common/onScreenMessages.js"
import { addSocketEvent, sendMessage, sendResourceUpdateMessage } from "../networking.js"
import { randomHexString } from "../tools.js"

/**
 * This class sets up what will appear in the game view.
 * It also takes updates from the server and passes the update data to the relevant components
 */
export class GameRenderer {
    constructor(spriteHandler, config) {
        this.spriteHandler = spriteHandler

        let toolbarY = config.MAP_HEIGHT + config.BORDER_B/4 - 10
        this.tm = new TowerMenu(
            config.MAP_WIDTH, config.MAP_HEIGHT + config.TOWER_MENU_HEIGHT, 0, 0, // Component w, h, x, y
            config.TOWER_MENU_WIDTH, config.TOWER_MENU_HEIGHT, -config.BORDER_L, toolbarY // Toolbar w, h, x, y
        )
        this.ut = new PlayersToolbar(config.PLAYER_TOOLBAR_WIDTH, config.PLAYER_TOOLBAR_HEIGHT, 0, 0)
        this.tc = new TowersComponent(this.spriteHandler, config.SPRITE_SIZE_MAP)
        this.ec = new EnemiesComponent(config.SPRITE_SIZE_TOWER, config.SPRITE_SIZE_MAP)
        this.bc = new BulletsComponent(config.SPRITE_SIZE_TOWER, config.SPRITE_SIZE_MAP)
        this.perRoundUpdateText = new OnScreenMessage(config.MAP_WIDTH/2, config.MAP_HEIGHT/2, "Round 1", 30)
        this.map = new MapComponent(config.MAP_COLS, config.MAP_ROWS, config.SPRITE_SIZE_MAP)

        this.gameSpace = new InteractiveGameSpace(
            this.map, this.tm,
            config.SPRITE_SIZE_MAP,
            config.MAP_WIDTH, config.MAP_HEIGHT + config.BORDER_B
        )
        this.gameSpace.x = config.BORDER_L
        this.gameSpace.y = config.BORDER_T

        this.startRoundButton = new StartRoundButton(config.MAP_WIDTH + config.BORDER_R, toolbarY)

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

        addSocketEvent("client/game/update", (gameUpdate) => {
            this.update(gameUpdate)
        })

        addSocketEvent("client/player/add", (gameUpdate) => {
            this.addPlayer(gameUpdate)
        })

        addSocketEvent("client/player/addSelf", (gameUpdate) => {
            this.addPlayer(gameUpdate)
        })

        addSocketEvent("client/player/remove", (gameUpdate) => {
            this.addPlayer(gameUpdate)
        })

        addSocketEvent("client/map/update", (grid) => {
            this.map.setGridValues(grid);
        })

        addSocketEvent("client/map/set", (grid) => {
            this.map.setGridValues(grid);
            this.map.constructMap(2)
        })

        addSocketEvent("client/player/ready", (playerData) => {
            this.ut.setPlayerReady(playerData.playerID)
        })

        addSocketEvent("client/game/round/start", () => {
            this.startRoundButton.stopInteraction()
        })

        addSocketEvent("client/game/round/end", (nextRoundInfo) => {
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
            this.startRoundButton.startInteraction()
            this.startRoundButton.update(nextRoundInfo.roundNumber.toString())
        })

        // TODO this should be a component specifically for communication with the server, initialised, and passed in like sprite handler
        // For now, use a pixi container as it can listen for events
        this.clientLink = new PIXI.Container()
        this.clientLink.on(("confirmTowerPlace"), (tower) => {
            let name = randomHexString(6)
            let setTowerMsg = {
                "row": tower.row,
                "col": tower.col,
                "type": tower.type,
                "id": name
            }
            sendMessage("server/map/set", setTowerMsg)
            tower.reset()
        })
        this.clientLink.on("start-round", () => {
            sendMessage("server/game/round/start")
        })
        this.clientLink.on("update-tower-aim", (tower, aimBehaviour) => {
            sendResourceUpdateMessage("tower", tower.name, [
                {
                    "property" : "aimBehaviour",
                    "newValue" : aimBehaviour
                }
            ])
        })
    }

    loadData() {
        let _this = this
        return new Promise((resolve) => {
            fetch("shared/json/towers.json").then((response) => {
                response.json().then((data) => {
                    _this.towerJson = data
                    _this.towerJson["colour"] = "0x" + randomHexString(6) // TODO this needs to go elsewhere, and in one place
                    _this.tm.setTowerData(data)
                    resolve()
                })
            })
        })
    }

    loadAssets() { // TODO load tower json and pass through
        return Promise.all([
            this.loadData(),
            this.tc.loadData(),
            this.ec.loadData(),
            this.bc.loadData()
        ])
    }

    startRendering() {
        // Register containers with the sprite layer
        // The order here is the order they are rendered on the map
        this.gameSpace.addChild(this.tc) // TODO call tick()
        this.gameSpace.addChild(this.ec)
        this.gameSpace.addChild(this.bc)

        this.spriteHandler.registerContainer(this.gameSpace)
        //this.spriteHandler.registerContainer(this.ut)
        this.spriteHandler.registerContainer(this.startRoundButton)
        this.spriteHandler.registerContainer(this.perRoundUpdateText)

        this.spriteHandler.registerContainer(this.debugExportGameButton)
        this.spriteHandler.registerContainer(this.debugImportGameButton)

        // Load towers into the menu
        this.tm.addTowers()
        this.tm.subscribeToAllTowers(this.gameSpace)  // TODO this should be done automatically

        this.tc.subscribe(this.gameSpace)

        // Now that tower menu towers are added, set up the event listeners
        this.gameSpace.setTowerInteraction()

        // Subscribe componenets to get updated when draggable towers are updated
        this.tm.subscribeToAllTowers(this.clientLink)
        this.startRoundButton.subscribe(this.clientLink)
        this.gameSpace.subscribeToDeployedTowerMenu(this.clientLink)

        // Begin the rendering loop
        this.spriteHandler.render()

        this.perRoundUpdateText.fadeInThenOut(1000, 2000)
    }

    // TODO I think tick from the sprite handler can just be donw using this update call. Keeps undates in line with the server.
    update(serverUpdate) {
        this.tc.update(serverUpdate["towers"])
        this.map.update(serverUpdate["towers"])
        this.tm.update(serverUpdate["players"])
        this.ec.update(serverUpdate["enemies"])
        this.bc.update(serverUpdate["bullets"])
        this.ut.update(serverUpdate["players"])
        this.gameSpace.updateTowers(serverUpdate["towers"])
        //this.git.update(serverUpdate["worldState"])
        this.tc.tick()
    }

    addPlayer(playerInfo) {
        this.ut.addPlayer(playerInfo)
    }
}
