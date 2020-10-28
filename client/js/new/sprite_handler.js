/**
 * This is the class that holds all the sprites and interaction with those sprites
 */
import { SUBGRID_SIZE, RIGHT_TOOLBAR_WIDTH, BOTTOM_TOOLBAR_WIDTH, BOTTOM_TOOLBAR_HEIGHT, MAP_WIDTH, MAP_HEIGHT, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y, APP_HEIGHT, APP_WIDTH} from "./../views/constants.js"
import { getState, getBoard, getGameID, getUsername } from "../state.js"


export class SpriteHandler {
    constructor() {
        this.app = new PIXI.Application({
            width: APP_WIDTH,
            height: APP_HEIGHT
        });

        const gameIDText = new PIXI.Text(getGameID());
        gameIDText.x = 20;
        gameIDText.y = 20;
        this.app.stage.addChild(gameIDText);
    
        //Add the canvas that Pixi automatically created to the HTML document
        document.body.appendChild(this.app.view);
    }

    load() {
        return PIXI.Loader.shared
            .add("client/img/map_spritesheet.png")
            .add("client/img/enemy_spritesheet.png")
            .add("client/img/tower_spritesheet.png")
            .add("client/img/bullet_spritesheet.png");
    }

    render() {
        this.app.ticker.add(delta => this.gameLoop(delta))
    }

    gameLoop() {}

    registerMap(mapContainer) {
        this.app.stage.addChild(mapContainer)
    }
}