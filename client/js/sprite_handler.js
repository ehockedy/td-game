/**
 * This is the class that holds all the sprites and interaction with those sprites
 */
export class SpriteHandler {
    constructor(width_px, height_px, resizeFactor=1, canvasElement=undefined) {
        this.width_px = width_px
        this.height_px = height_px
        this.resizeFactor = resizeFactor

        this.app = canvasElement ? 
            new PIXI.Application({
                view: canvasElement,
                width: this.width_px,
                height: this.height_px,
            })
            :
            new PIXI.Application({
                width: this.width_px,
                height: this.height_px,
            })

        // Sprite that focus is currently on
        this.activeClickable
    }

    getCanvas() {
        return this.app.view
    }

    setResizeToWindow() {
        this.app.resizeTo = window
    }

    render() {
        this.app.ticker.add(delta => this.gameLoop(delta))
    }

    clear() {
        this.app.stage.removeChildren()
    }

    gameLoop() {}

    // Add a PIXI container (or sub class) to the sprite pool to be rendered
    registerContainer(container) {
        this.app.stage.addChild(container)
    }

    // Add PIXI container, but will have the tick update function called every iteration of the randering loop
    registerDynamicContainer(container) {
        this.registerContainer(container)
        this.app.ticker.add(()=>{container.tick()})
    }

    removeContainer(container) {
        this.app.stage.removeChild(container)
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