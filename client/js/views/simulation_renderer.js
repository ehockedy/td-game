import { MapComponent } from "../components/game/map.js"
import { TowersComponent } from "../components/game/towersComponent.js"
import { EnemiesComponent } from "../components/game/enemiesComponent.js"
import { BulletsComponent } from "../components/game/bulletsComponent.js"
import { RoundCounter } from "../components/game/ui/roundCounter.js"
import { Counter } from "../components/game/ui/counter.js"
import { COLOURS } from "../components/ui_common/style.js"

/**
 * This class sets up what will appear in the game view.
 * It also takes updates from the server and passes the update data to the relevant components
 */
export class SimulationRender {
    constructor(socket, spriteHandler, config) {
        this.spriteHandler = spriteHandler
        this.socket = socket
        this.round = 1

        this.thisPlayerID = "sim_player"
        this.players = {}

        // Calculate the border around the play area. This ara will be renedered but path/towers will not be placed here
        // but the map will be rendered there.
        this.maxBorderSize = Math.max(config.BORDER_L, config.BORDER_R, config.BORDER_T, config.BORDER_B) / config.SPRITE_SIZE_MAP

        this.tc = new TowersComponent(this.spriteHandler, config.SPRITE_SIZE_MAP)
        this.tc.setSimulation()
        this.ec = new EnemiesComponent(config.SPRITE_SIZE_TOWER, config.SPRITE_SIZE_MAP)
        this.bc = new BulletsComponent(config.SPRITE_SIZE_TOWER, config.SPRITE_SIZE_MAP)
        this.map = new MapComponent(config.SPRITE_SIZE_MAP)


        const counterWidth = 200
        
        this.moneyCounter = new Counter(config.TOWER_MENU_WIDTH, config.MAP_HEIGHT, counterWidth, "Money", 0, COLOURS.MENU_SANDY, true)
        this.livesCounter = new Counter(config.TOWER_MENU_WIDTH + this.moneyCounter.width, config.MAP_HEIGHT, counterWidth, "Lives", 100, COLOURS.MENU_SANDY, true)
        this.roundCounter = new Counter(this.livesCounter.x + this.livesCounter.width, config.MAP_HEIGHT, counterWidth, "Round", this.round, COLOURS.MENU_SANDY, true)

        this.setServerEventListeners()
    }

    loadData() {
        return new Promise((resolve) => {
            fetch("shared/json/towers.json").then((response) => {
                response.json().then((towerData) => {
                    this.tc.setData(towerData, this.players, this.thisPlayerID),  // TODO this is a bit hacky with the spoofed sim player data - improve
                    resolve()
                })
            })
        })
    }

    /**
     * Set up the events that the game shoud listen for
     * These events come from the server
     */
    setServerEventListeners() {
        this.socket.on("client/game/update", (gameUpdate) => {
            this.update(gameUpdate)
        })
        this.socket.on("client/map/set", (mapData) => {
            this.map.constructMap(mapData, true, 1, this.maxBorderSize);
        })
    }

    reset() {
        // TODO 
    }

    startRendering() {
        this.spriteHandler.registerContainer(this.map)
        this.spriteHandler.registerContainer(this.ec)
        this.spriteHandler.registerContainer(this.tc)
        this.spriteHandler.registerContainer(this.bc)
        this.spriteHandler.registerContainer(this.livesCounter)
        this.spriteHandler.registerContainer(this.moneyCounter)
        this.spriteHandler.registerContainer(this.roundCounter)

        // Begin the rendering loop
        this.spriteHandler.render()
    }

    update(serverUpdate) {
        this.tc.update(serverUpdate.towers)
        this.map.update(serverUpdate.towers)
        this.bc.update(serverUpdate.bullets)
        this.ec.update(serverUpdate.enemies)
        this.livesCounter.update(serverUpdate.worldState.lives)
        this.tc.tick()

        serverUpdate.players.objects.forEach((player) => {
            if (player.playerID == this.thisPlayerID) {
                this.moneyCounter.update(player.stats.money)
            }
        })

        if (serverUpdate.worldState.round != this.round) {
            this.round = serverUpdate.worldState.round
            this.roundCounter.update(this.round)
        }
    }
}
