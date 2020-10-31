/**
 * This is the class that holds all the sprites and interaction with those sprites
 */
import { APP_HEIGHT, APP_WIDTH} from "./../views/constants.js"
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

    render() {
        this.app.ticker.add(delta => this.gameLoop(delta))
    }

    gameLoop() {}

    registerContainer(mapContainer) { // TODO should this be a generic add container
        this.app.stage.addChild(mapContainer)
    }

    addTowerMenuSprite(sprite) {
        this.app.stage.getChildByName("towermenu").addChild(sprite)
    }

    containerSize(name) {
        return this.app.stage.getChildByName(name).children.length
    }
}