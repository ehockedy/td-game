import { MapComponent } from "../components/game/map.js"
import { TowerMenu } from "../components/game/towerMenu.js"
import { InfoToolbar } from "../components/game/infoToolbar.js"
import { PlayersToolbar } from "../components/game/playersToolbar.js"
import { TowersComponent } from "../components/game/towersComponent.js"
import { EnemiesComponent } from "../components/game/enemiesComponent.js"
import { BulletsComponent } from "../components/game/bulletsComponent.js"
import { GraphicButton } from "../components/ui_common/button.js"
import { RIGHT_TOOLBAR_WIDTH, RIGHT_TOOLBAR_HEIGHT, MAP_WIDTH, MAP_HEIGHT, BOTTOM_TOOLBAR_HEIGHT, APP_WIDTH, APP_HEIGHT } from "../constants.js"
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
        this.tm = new TowerMenu(this.spriteHandler, RIGHT_TOOLBAR_WIDTH, RIGHT_TOOLBAR_HEIGHT, MAP_WIDTH, 0)
        this.it = new InfoToolbar(this.spriteHandler, RIGHT_TOOLBAR_WIDTH, RIGHT_TOOLBAR_HEIGHT, MAP_WIDTH, RIGHT_TOOLBAR_HEIGHT)
        this.ut = new PlayersToolbar(this.spriteHandler, MAP_WIDTH, BOTTOM_TOOLBAR_HEIGHT, 0, MAP_HEIGHT)
        this.tc = new TowersComponent(this.spriteHandler)
        this.ec = new EnemiesComponent(this.spriteHandler)
        this.bc = new BulletsComponent(this.spriteHandler)

        this.startRoundButton = new GraphicButton(
            120, 90, // width, height
            APP_WIDTH, APP_HEIGHT, // x, y
            "Start Round",
            40, 0x448877, // font size, colour
            1, 1) // anchor
        this.startRoundButton.on("click", ()=>{sendMessage(MSG_TYPES.ROUND_START)})
        this.startRoundButton.on("tap", ()=>{sendMessage(MSG_TYPES.ROUND_START)})

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
        this.tc.registerRangeSpriteContainer()
        this.tm.registerContainer()
        this.it.registerContainer()
        this.ut.registerContainer()
        this.tc.registerContainer()
        this.ec.registerContainer()
        this.bc.registerContainer()
        this.spriteHandler.registerContainer(this.startRoundButton)

        // Set up links between components that need them
        this.tc.setInfoToolbarLink(this.it)
        this.tm.setTowerFactoryLink(this.tc)
        this.tc.setTowerMenuLink(this.tm)

        this.tm.addTowers()

        // Begin the rendering loop
        this.spriteHandler.render()
    }

    update(serverUpdate) {
        this.tc.update(serverUpdate["towers"])
        this.ec.update(serverUpdate["enemies"])
        this.bc.update(serverUpdate["bullets"])
        this.ut.update(serverUpdate["players"])
        this.it.update()
    }

    addPlayer(playerInfo) {
        this.ut.addPlayer(playerInfo)
    }
}
