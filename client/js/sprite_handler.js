/**
 * This is the class that holds all the sprites and interaction with those sprites
 */
import { APP_HEIGHT, APP_WIDTH} from "./constants.js"

export class SpriteHandler {
    constructor() {
        this.app = new PIXI.Application({
            width: APP_WIDTH,
            height: APP_HEIGHT
        });
    
        //Add the canvas that Pixi automatically created to the HTML document
        document.body.appendChild(this.app.view);

        // Sprite that focus is currently on
        this.activeClickable

        // List of sprites that have should be manually updated by each iteration of the render loop
        // Each sprite should have the "tick" event registered to them
        this.updatables = []
    }

    render() {
        this.app.ticker.add(delta => this.gameLoop(delta))
    }

    stopRender() {
        this.app.stage.removeChildren()
        document.body.removeChild(this.app.view)
    }

    gameLoop() {
        this.updatables.forEach((sprite)=>{
            sprite.emit("tick")
        })
    }

    registerUpdatableSprite(sprite) {
        this.updatables.push(sprite)
    }

    registerContainer(container) {
        this.app.stage.addChild(container)
    }

    containerSize(name) {
        return this.app.stage.getChildByName(name).children.length
    }

    getActiveClickable() {
        return this.activeClickable
    }

    setActiveClickable(sprite) {
        this.activeClickable = sprite
    }

    isActiveClickableSet() {
        return typeof this.activeClickable != "undefined"
    }

    unsetActiveClickable() {
        this.activeClickable = undefined
    }

    unclickActiveClickable() {
        if (this.isActiveClickableSet()) this.activeClickable.emit('clickoff')
        this.unsetActiveClickable()
    }

    onCanvasClick(event) {
        if (this.isActiveClickableSet()) {
            if (!this.activeClickable.containsPoint(new PIXI.Point(event.layerX, event.layerY))) {
                this.activeClickable.emit('clickoff'); // clickoff event is agnostic to the type of object stored in activeClickable
            }
        }
    }
}