/**
 * This is the class that holds all the sprites and interaction with those sprites
 */
export class SpriteHandler {
    constructor(width_px, height_px, resizeFactor=1) {
        this.width_px = width_px
        this.height_px = height_px
        this.resizeFactor = resizeFactor

        this.app = new PIXI.Application({
            width: this.width_px,
            height: this.height_px
        });

        // Sprite that focus is currently on
        this.activeClickable

        // View scaling
        this.margin = 16 // The margin to include in every aspect ration calculation, to ensure scaled view does not quite touch the window edges
                         //  If it does, a scrollbar appears
        this.globalResizeMultiplier = 1 // The scale of the view, relative to the previous scale
    }

    getCanvas() {
        return this.app.view
    }

    render() {
        this.app.ticker.add(delta => this.gameLoop(delta))
    }

    clear() {
        this.app.stage.removeChildren()
    }

    gameLoop() {
        this.resizeView()
    }

    resizeView() {
        // We only want to resize if the browser window is made smaller than the game view. If not, then sprites become too big and look slightly blurry. 
        let resizeMultiplier = 1
        if (window.innerHeight < this.height_px || window.innerWidth < this.width_px) {
            // Keep ratio the same, so see if width or height needs to be scaled the most to be visible
            resizeMultiplier = Math.min((window.innerWidth - this.margin) / this.width_px, (window.innerHeight - this.margin) / this.height_px) * this.resizeFactor
        }

        if (resizeMultiplier != this.globalResizeMultiplier) { // If a resize has occurred, scale the canvas and everything in it
            this.globalResizeMultiplier = resizeMultiplier

            // Editing the CSS seems to be the simplest way - all the sprites scale too
            this.app.view.style.width = this.width_px * resizeMultiplier + 'px'
            this.app.view.style.height = this.height_px * resizeMultiplier + 'px'
        }
    }

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