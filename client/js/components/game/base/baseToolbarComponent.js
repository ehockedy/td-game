import { BaseComponent } from "./baseComponent.js";

export class BaseToolbarComponent extends BaseComponent {
    constructor(containerName, width_px, height_px, x, y) {
        super(containerName)
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

        this.addChild(this.backgroundContainer)
    }

    renderTitle(titleText) {
        let xMargin = 10

        let titleStyle = {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: this.width_px - xMargin,
            fill: "0x000000"
        }

        let text = new PIXI.Text(titleText, titleStyle);
        text.x = Math.floor(this.width_px/2)
        text.anchor.set(0.5, 0)
        return text
    }
}
