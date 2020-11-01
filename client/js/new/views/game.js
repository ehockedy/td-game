import { SpriteHandler } from "../sprite_handler.js"
import { MapComponent } from "../components/map.js"
import { TowerMenu } from "../components/towerMenu.js"
import { InfoToolbar } from "../components/infoToolbar.js"
import { TowersComponent } from "../components/towersComponent.js"
import { RIGHT_TOOLBAR_WIDTH, RIGHT_TOOLBAR_HEIGHT, MAP_WIDTH } from "./../../views/constants.js"

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
        this.tc = new TowersComponent(this.spriteHandler)
    }

    loadAssets() {
        let _tc = this.tc
        return new Promise((resolve, reject)=>{
            // Load sprite assets
            PIXI.Loader.shared
                .add("client/img/map_spritesheet.png")
                .add("client/img/enemy_spritesheet.png")
                .add("client/img/tower_spritesheet.png")
                .add("client/img/bullet_spritesheet.png")
                .load(function() {
                    // Then load tower json
                    _tc.loadData()
                        // Then can resolve this call and start the game
                        .then(resolve)
                })
        })
    }

    startRendering() {
        // Register containers with the sprite layer
        // TODO make the order the depth they appear on the map
        this.map.registerContainer()
        this.tm.registerContainer()
        this.it.registerContainer()
        this.tc.registerContainer()

        // Set up links between components that need them
        this.tm.setInfoToolbarLink(this.it)
        this.tm.setTowerFactoryLink(this.tc)

        this.tm.addTowers()

        // Begin the rendering loop
        this.spriteHandler.render()
    }

    update(serverUpdate) {
        this.tc.update(serverUpdate["towers"])
    }

}
