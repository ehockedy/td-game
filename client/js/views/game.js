import { MapComponent } from "../components/game/map.js"
import { TowerMenu } from "../components/game/towerMenu.js"
import { InteractiveGameSpace } from "../components/game/interactiveGameSpace.js"
import { PlayersToolbar } from "../components/game/playersToolbar.js"
import { TowersComponent } from "../components/game/towersComponent.js"
import { EnemiesComponent } from "../components/game/enemiesComponent.js"
import { BulletsComponent } from "../components/game/bulletsComponent.js"
import { StartRoundButton } from "../components/game/ui/startRoundButton.js"
import { Counter } from "../components/game/ui/counter.js"
import { OnScreenMessage } from "../components/ui_common/onScreenMessages.js"
import { randomHexString } from "../tools.js"
import { COLOURS } from "../components/ui_common/style.js"

/**
 * This class sets up what will appear in the game view.
 * It also takes updates from the server and passes the update data to the relevant components
 */
export class GameRenderer {
    constructor(socket, spriteHandler, config, thisPlayerID) {
        this.spriteHandler = spriteHandler
        this.socket = socket
        this.round = 1

        this.thisPlayerID = thisPlayerID
        this.playerData = {}
        this.playerData[this.thisPlayerID] = {
            "colour": "0x0066AA",  // TODO CHANGE ME
            "isThisPlayer": true
        }

        // Calculate the border around the play area. This ara will be renedered but path/towers will not be placed here
        // but the map will be rendered there.
        this.maxBorderSize = Math.max(config.BORDER_L, config.BORDER_R, config.BORDER_T, config.BORDER_B) / config.SPRITE_SIZE_MAP

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
            this.map, this.tm, this.tc, this.ec, this.bc,
            config.SPRITE_SIZE_MAP,
            config.MAP_WIDTH, config.MAP_HEIGHT + config.BORDER_B
        )
        this.gameSpace.x = config.BORDER_L
        this.gameSpace.y = config.BORDER_T

        this.startRoundButton = new StartRoundButton(config.MAP_WIDTH + config.BORDER_R, toolbarY)

        this.moneyCounter = new Counter(config.MAP_WIDTH + config.BORDER_R, toolbarY, 180, "Money", 0, COLOURS.MONEY)
        this.moneyCounter.y -= (this.moneyCounter.height + 10)

        this.livesCounter = new Counter(config.MAP_WIDTH + config.BORDER_R, this.moneyCounter.y, 160, "Lives", 100)
        this.livesCounter.y -= (this.livesCounter.height + 10)

        this.setServerEventListeners()
        this.localEventEmitter = this.setServerEventEmitter()
    }

    loadData() {
        return new Promise((resolve) => {
            fetch("shared/json/towers.json").then((response) => {
                response.json().then((towerData) => {
                    this.tm.setData(towerData, this.thisPlayerID, this.playerData[this.thisPlayerID].colour),
                    this.tc.setData(towerData, this.playerData),
                    resolve()
                })
            })
        })
    }

    loadAssets() { // TODO load tower json and pass through
        return Promise.all([
            this.loadData(),
            this.ec.loadData(),
            this.bc.loadData()
        ])
    }

    /**
     * Set up the events that the game shoud listen for
     * These events come from the server
     */
    setServerEventListeners() {
        this.socket.on("client/game/update", (gameUpdate) => {
            this.update(gameUpdate)
        })

        this.socket.on("client/player/add", (gameUpdate) => {
            this.addPlayer(gameUpdate)
        })

        this.socket.on("client/player/addSelf", (gameUpdate) => {
            this.addPlayer(gameUpdate)
        })

        this.socket.on("client/player/remove", (gameUpdate) => {
            this.addPlayer(gameUpdate)
        })

        this.socket.on("client/map/update", (grid) => {
            this.map.setGridValues(grid);
        })

        this.socket.on("client/player/ready", (playerData) => {
            this.ut.setPlayerReady(playerData.playerID)
        })

        this.socket.on("client/game/round/start", () => {
            this.startRoundButton.stopInteraction()
        })
    }

    /**
     * Create an event emitter that has some events registered to it
     * When these events are triggered it results in sending a message to the server
     * @returns Event emitter that can be used to subscribe to componenets
     */
    setServerEventEmitter() {
        let eventEmitter = new PIXI.utils.EventEmitter()

        // Confirm that this player is ready to begin the round
        eventEmitter.on("start-round", () => {
            this.socket.emit("server/game/round/start")
        })

        // Player has chosen where to place a tower, update the server which will tell all other players
        eventEmitter.on(("confirmTowerPlace"), (tower) => {
            this.socket.emit("server/tower/set",
            {
                "name": randomHexString(6),
                "operation": "add",
                "parameters": {
                    "row": tower.row,
                    "col": tower.col,
                    "type": tower.type
                }
            })
        })

        // Update the aim settings of a tower
        eventEmitter.on("update-tower", (tower, operation, property, value) => {
            this.socket.emit("server/tower/set",
            {
               "name": tower.name,
               "operation": operation,
               "property": property,
               "value": value
            })
        })

        eventEmitter.on("sell-tower", (tower, operation) => {
            this.socket.emit("server/tower/set",
            {
               "name": tower.name,
               "operation": operation
            })
        })

        return eventEmitter
    }

    startRendering() {
        this.socket.emit("server/map/get", (map) => {
            this.map.setGridValues(map);
            this.map.constructMap(this.maxBorderSize)
        })

        this.spriteHandler.registerContainer(this.gameSpace)
        //this.spriteHandler.registerContainer(this.ut)
        this.spriteHandler.registerContainer(this.startRoundButton)
        this.spriteHandler.registerContainer(this.livesCounter)
        this.spriteHandler.registerContainer(this.moneyCounter)
        this.spriteHandler.registerContainer(this.perRoundUpdateText)

        // Load towers into the menu
        this.tm.addTowers()
        this.tm.subscribeToAllTowers(this.gameSpace)  // TODO this should be done automatically

        this.tc.subscribe(this.gameSpace)

        // Now that tower menu towers are added, set up the event listeners
        this.gameSpace.setTowerInteraction()

        // Subscribe componenets to get updated when draggable towers are updated
        this.tm.subscribeToAllTowers(this.localEventEmitter)
        this.startRoundButton.subscribe(this.localEventEmitter)
        this.gameSpace.subscribeToDeployedTowerMenu(this.localEventEmitter)

        // Begin the rendering loop
        this.spriteHandler.render()

        this.perRoundUpdateText.fadeInThenOut(1000, 2000)
    }

    startNextRound() {
        let timePerFade = 1000
        let timeBetweenFade = 2000
        let timeBetweenMessages = 2000
        this.perRoundUpdateText.updateText("Round Complete")
        this.perRoundUpdateText.fadeInThenOut(timePerFade, timeBetweenFade)
        setTimeout(()=>{
            this.perRoundUpdateText.updateText("Round " + this.round.toString())
            this.perRoundUpdateText.fadeInThenOut(timePerFade, timeBetweenFade)
        }, timePerFade*2 + timeBetweenMessages)
        //this.ut.unsetAllPlayers()
        this.startRoundButton.startInteraction()
        this.startRoundButton.update(this.round.toString())
    }

    update(serverUpdate) {
        this.tc.update(serverUpdate.towers)
        this.map.update(serverUpdate.towers)
        this.tm.update(serverUpdate.players)
        this.ut.update(serverUpdate.players)
        this.gameSpace.updateTowers(serverUpdate.towers)
        this.bc.update(serverUpdate.bullets)
        this.ec.update(serverUpdate.enemies)
        this.livesCounter.update(serverUpdate.worldState.lives)
        //this.git.update(serverUpdate["worldState"])
        this.tc.tick()

        serverUpdate.players.objects.forEach((player) => {
            if (player.playerID == this.thisPlayerID) {
                this.moneyCounter.update(player.stats.money)
            }
        })

        // Check if the round has finished and therefor changed
        if (serverUpdate.worldState.round != this.round) {
            this.round = serverUpdate.worldState.round
            this.startNextRound()
        }
    }

    addPlayer(playerInfo) {
        this.ut.addPlayer(playerInfo)
    }
}
