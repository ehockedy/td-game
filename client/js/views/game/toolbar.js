
class Toolbar {
    constructor(width_px, height_px, col="0xFFFFFF") {
        this.container = new PIXI.Container();
        let graphics = new PIXI.Graphics();
        graphics.beginFill(col)
        graphics.drawRect(0, 0, width_px, height_px)
        this.container.addChild(graphics)

        this.width_px = width_px
        this.height_px = height_px
    }

    setX(x_px) {
        this.container.children.forEach((child) => {
            child.x = x_px
        })
    }

    setY(y_px) {
        this.container.children.forEach((child) => {
            child.y = y_px
        })
    }

}

export {Toolbar}