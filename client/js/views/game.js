import { MapComponent } from "../components/game/map.js"
import { TowerMenu } from "../components/game/towerMenu.js"
import { InteractiveGameSpace } from "../components/game/interactiveGameSpace.js"
import { PlayersToolbar } from "../components/game/playersToolbar.js"
import { TowersComponent } from "../components/game/towersComponent.js"
import { EnemiesComponent } from "../components/game/enemiesComponent.js"
import { BulletsComponent } from "../components/game/bulletsComponent.js"
import { StartRoundButton } from "../components/game/ui/startRoundButton.js"
import { FastForwardButton } from "../components/game/ui/fastForwardButton.js"
import { RoundCounter } from "../components/game/ui/roundCounter.js"
import { Counter } from "../components/game/ui/counter.js"
import { OnScreenMessage } from "../components/ui_common/onScreenMessages.js"
import { randomHexString } from "../tools.js"
import { COLOURS } from "../components/ui_common/style.js"

/**
 * This class sets up what will appear in the game view.
 * It also takes updates from the server and passes the update data to the relevant components
 */
export class GameRenderer {
    constructor(socket, spriteHandler, config, enemyConfig, bulletConfig, thisPlayerID, players, gameSettings) {
        this.spriteHandler = spriteHandler
        this.socket = socket
        this.round = 1
        this.maxRounds = gameSettings.numRounds

        this.thisPlayerID = thisPlayerID
        this.players = players

        // Calculate the border around the play area. This ara will be renedered but path/towers will not be placed here
        // but the map will be rendered there.
        this.maxBorderSize = Math.max(config.BORDER_L, config.BORDER_R, config.BORDER_T, config.BORDER_B) / config.SPRITE_SIZE_MAP
        const rhs = config.MAP_WIDTH + config.BORDER_R;
        const top_bottom_gap = 10
        this.rightBoundary = rhs

        let toolbarY = config.MAP_HEIGHT + config.BORDER_B/4 - top_bottom_gap
        this.tm = new TowerMenu(
            config.MAP_WIDTH, config.MAP_HEIGHT + config.TOWER_MENU_HEIGHT, 0, 0, // Component w, h, x, y
            config.TOWER_MENU_WIDTH, config.TOWER_MENU_HEIGHT, -config.BORDER_L, toolbarY // Toolbar w, h, x, y
        )
        this.ut = new PlayersToolbar(this.players)
        this.ut.x = rhs
        this.ut.y = top_bottom_gap

        this.tc = new TowersComponent(this.spriteHandler, config.SPRITE_SIZE_MAP)
        this.ec = new EnemiesComponent(config.SPRITE_SIZE_TOWER, config.SPRITE_SIZE_MAP, enemyConfig)
        this.bc = new BulletsComponent(config.SPRITE_SIZE_TOWER, config.SPRITE_SIZE_MAP, bulletConfig)
        this.perRoundUpdateText = new OnScreenMessage(config.MAP_WIDTH/2, config.MAP_HEIGHT/2, "Round 1", 80)
        this.map = new MapComponent(config.SPRITE_SIZE_MAP)

        this.gameSpace = new InteractiveGameSpace(
            this.map, this.tm, this.tc, this.ec, this.bc,
            config.SPRITE_SIZE_MAP,
            config.MAP_WIDTH, config.MAP_HEIGHT + config.BORDER_B
        )
        this.gameSpace.x = config.BORDER_L
        this.gameSpace.y = config.BORDER_T

        this.startRoundButton = new StartRoundButton(rhs, toolbarY)
        this.fastForwardButton = new FastForwardButton(rhs, toolbarY)
        this.fastForwardButton.visible = false

        const counterWidth = 200
        this.roundCounter = new RoundCounter(rhs, toolbarY, counterWidth-20, this.round, this.maxRounds, COLOURS.MENU_SANDY)
        this.roundCounter.y -= (this.roundCounter.height + top_bottom_gap)

        this.moneyCounter = new Counter(config.TOWER_MENU_WIDTH, toolbarY, counterWidth, "Money", 0, COLOURS.MENU_SANDY)
        this.livesCounter = new Counter(config.TOWER_MENU_WIDTH + this.moneyCounter.width, toolbarY, counterWidth, "Lives", 100, COLOURS.MENU_SANDY)

        this.setServerEventListeners()
        this.localEventEmitter = this.setServerEventEmitter()
    }

    destructor() {
        this.socket.off("client/player/add")
        this.socket.off("client/player/addSelf")
        this.socket.off("client/player/remove")
        this.socket.off("client/player/ready")
        this.socket.off("client/map/update")
        this.socket.off("client/game/round/start")
        this.socket.off("client/game/round/toggleFastForward")
        this.socket.off("client/game/update")
    }

    loadData() {
        return new Promise((resolve) => {
            fetch("shared/json/towers.json").then((response) => {
                response.json().then((towerData) => {
                    this.tm.setData(towerData, this.thisPlayerID, this.players[this.thisPlayerID].colour),
                    this.tc.setData(towerData, this.players, this.thisPlayerID),
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
            this.map.updateMapStructure(grid);
        })

        this.socket.on("client/player/ready", (playerData) => {
            this.ut.setPlayerReady(playerData.playerID)
            if (playerData.playerID == this.thisPlayerID) {
                this.startRoundButton.stopInteraction()
            }
        })

        this.socket.on("client/game/round/start", () => {
            this.ut.unsetAllPlayers()
            this.startRoundButton.stopInteraction()
            this.startRoundButton.visible = false
            this.fastForwardButton.visible = true
        })

        this.socket.on("client/game/round/toggleFastForward", () => {
            console.log("Toggled")
            this.fastForwardButton.toggleFastForward()
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

        // Fast forward the round - does this for all players
        eventEmitter.on("toggle-fast-forward", () => {
            this.socket.emit("server/game/round/toggleFastForward")
        })

        // Player has chosen where to place a tower, update the server which will tell all other players
        eventEmitter.on("confirmTowerPlace", (tower) => {
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

        eventEmitter.on("upgrade-tower", (tower, operation, type) => {
            this.socket.emit("server/tower/set",
            {
               "name": tower.name,
               "operation": operation,
               "type": type,
            })
        })

        return eventEmitter
    }

    startRendering() {
        this.socket.emit("server/map/get", (map) => {
            this.map.constructMap(map, true, 1, this.maxBorderSize);
        })

        this.spriteHandler.registerContainer(this.gameSpace)
        this.spriteHandler.registerContainer(this.ut)
        this.spriteHandler.registerContainer(this.startRoundButton)
        this.spriteHandler.registerContainer(this.fastForwardButton)
        this.spriteHandler.registerContainer(this.livesCounter)
        this.spriteHandler.registerContainer(this.moneyCounter)
        this.spriteHandler.registerContainer(this.perRoundUpdateText)
        this.spriteHandler.registerContainer(this.roundCounter)

        // Load towers into the menu
        this.tm.addTowers()
        this.tm.subscribeToAllTowers(this.gameSpace)  // TODO this should be done automatically

        this.tc.subscribe(this.gameSpace)

        // Now that tower menu towers are added, set up the event listeners
        this.gameSpace.setTowerInteraction()

        // Subscribe componenets to get updated when draggable towers are updated
        this.tm.subscribeToAllTowers(this.localEventEmitter)
        this.startRoundButton.subscribe(this.localEventEmitter)
        this.fastForwardButton.subscribe(this.localEventEmitter)
        this.gameSpace.subscribeToDeployedTowerMenu(this.localEventEmitter)

        // Begin the rendering loop
        this.spriteHandler.render()

        this.perRoundUpdateText.fadeInThenOut(1000, 2000)
    }

    startNextRound() {
        let timePerFade = 200
        let timeBetweenFade = 4000
        let timeBetweenMessages = 2000
        this.perRoundUpdateText.updateText("Round Complete")
        this.perRoundUpdateText.fadeInThenOut(timePerFade, timeBetweenFade)

        setTimeout(()=>{
            this.perRoundUpdateText.updateText("Round " + this.round.toString())
            this.perRoundUpdateText.fadeInThenOut(timePerFade, timeBetweenFade)
        }, timePerFade*2 + timeBetweenMessages)
        this.fastForwardButton.visible = false
        this.fastForwardButton.reset()
        this.startRoundButton.visible = true
        this.startRoundButton.startInteraction()
    }
    
    update(serverUpdate) {
        let thisPlayerMoney = 0
        serverUpdate.players.objects.forEach((player) => {
            if (player.playerID == this.thisPlayerID) {
                thisPlayerMoney = player.stats.money
                this.moneyCounter.update(player.stats.money)
            }
        })
        this.tc.update(serverUpdate.towers)
        this.map.update(serverUpdate.towers)
        this.tm.update(serverUpdate.players)
        this.ut.update(serverUpdate.players)
        this.gameSpace.updateTowers(serverUpdate.towers, thisPlayerMoney)
        this.bc.update(serverUpdate.bullets)
        this.ec.update(serverUpdate.enemies)
        this.ec.updateEndOfPathEnemies(this.rightBoundary)
        this.livesCounter.update(serverUpdate.worldState.lives)
        this.tc.tick()

        // Check if the round has finished and therefor changed
        if (serverUpdate.worldState.round != this.round) {
            this.round = serverUpdate.worldState.round
            this.startNextRound()
            this.roundCounter.update(this.round)
        }
    }

    addPlayer(playerInfo) {
        this.ut.addPlayer(playerInfo)
    }
}
