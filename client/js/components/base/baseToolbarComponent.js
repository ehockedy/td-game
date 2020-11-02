import { BaseComponent } from "./baseComponent.js";

export class BaseToolbarComponent extends BaseComponent {
    constructor(sprite_handler, containerName, width_px, height_px, x, y) {
        super(sprite_handler, containerName)
        this.width_px = width_px
        this.height_px = height_px
        this.x = x
        this.y = y

        // Add the toolbar background
        let graphics = new PIXI.Graphics();
        graphics.beginFill("0x727272")
        graphics.drawRect(0, 0, this.width_px, this.height_px)
        this.container.addChild(graphics)
        this.container.x = this.x
        this.container.y = this.y
    }

    registerContainer() {
        super.registerContainer()
    }
}
