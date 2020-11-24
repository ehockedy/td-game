import { SpriteHandler } from "../sprite_handler.js"
import { MapComponent } from "../components/game/map.js"
import { TowerMenu } from "../components/game/towerMenu.js"
import { InfoToolbar } from "../components/game/infoToolbar.js"
import { PlayersToolbar } from "../components/game/playersToolbar.js"
import { TowersComponent } from "../components/game/towersComponent.js"
import { EnemiesComponent } from "../components/game/enemiesComponent.js"
import { BulletsComponent } from "../components/game/bulletsComponent.js"
import { RIGHT_TOOLBAR_WIDTH, RIGHT_TOOLBAR_HEIGHT, MAP_WIDTH, MAP_HEIGHT, BOTTOM_TOOLBAR_HEIGHT } from "../constants.js"

/**
 * This class sets up what will appear in the game view.
 * It also takes updates from the server and passes the update data to the relevant components
 */
export class GameRenderer {
    constructor() {
        this.spriteHandler = new SpriteHandler()
        this.map = new MapComponent(this.spriteHandler)
        this.tm = new TowerMenu(this.spriteHandler, RIGHT_TOOLBAR_WIDTH, RIGHT_TOOLBAR_HEIGHT, MAP_WIDTH, 0)
        this.it = new InfoToolbar(this.spriteHandler, RIGHT_TOOLBAR_WIDTH, RIGHT_TOOLBAR_HEIGHT, MAP_WIDTH, RIGHT_TOOLBAR_HEIGHT)
        this.ut = new PlayersToolbar(this.spriteHandler, MAP_WIDTH, BOTTOM_TOOLBAR_HEIGHT, 0, MAP_HEIGHT)
        this.tc = new TowersComponent(this.spriteHandler)
        this.ec = new EnemiesComponent(this.spriteHandler)
        this.bc = new BulletsComponent(this.spriteHandler)
    }

    loadAssets() {
        let _tc = this.tc
        let _it = this.it
        let _ec = this.ec
        return new Promise((resolve)=>{
            // Load sprite assets
            PIXI.Loader.shared
                .add("client/img/enemy_spritesheet.png")
                .add("client/img/tower_spritesheet.png")
                .add("client/img/bullet_spritesheet.png")
                .load(function() {
                    // Load component data and textures
                    Promise.all([_tc.loadData(), _it.loadData(), _ec.loadData()])
                    .then(resolve)
                })
        })
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

        // Set up links between components that need them
        this.tc.setInfoToolbarLink(this.it)
        this.tm.setTowerFactoryLink(this.tc)
        this.tc.setTowerMenuLink(this.tm)

        this.map.constructMap()
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
