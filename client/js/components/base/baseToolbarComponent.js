import { BaseComponent } from "./baseComponent.js";

export class BaseToolbarComponent extends BaseComponent {
    constructor(sprite_handler, containerName, width_px, height_px, x, y) {
        super(sprite_handler, containerName)
        this.width_px = width_px
        this.height_px = height_px
        this.x = x
        this.y = y

        // This keeps track of the elements added to the toolbar already
        this.toolbarComponentsX = this.x
        this.toolbarComponentsY = this.y

        // Add the toolbar background
        let graphics = new PIXI.Graphics();
        graphics.beginFill("0x727272")
        graphics.drawRect(0, 0, this.width_px, this.height_px)

        // Keep background and towers separate
        this.backgroundContainer = new PIXI.Container()
        this.backgroundContainer.addChild(graphics)
        this.backgroundContainer.x = this.x
        this.backgroundContainer.y = this.y

        this.container.x = this.x
        this.container.y = this.y
    }

    registerContainer() {
        this.sprite_handler.registerContainer(this.backgroundContainer)
        super.registerContainer()
    }
}
