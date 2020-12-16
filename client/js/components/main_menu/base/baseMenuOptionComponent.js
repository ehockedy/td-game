import { BaseComponent } from  "../../../components/game/base/baseComponent.js";
import { menuOptionStyle } from "../../../styles/text.js"

export class BaseMenuOptionComponent extends BaseComponent {
    constructor(containerName, x, y, text) {
        super(containerName)

        this.textSprite = new PIXI.Text(text, menuOptionStyle);
        this.textSprite.anchor.set(0.5);
        this.textSprite.name = containerName
        this.textSprite.interactive = true
        this.textSprite.buttonMode = true

        this.x = x
        this.y = y
        this.addChild(this.textSprite)
    }

    // Generic button events
    onButtonHover() {
        this.scale.set(1.2)
    }
    
    onButtonStopHover() {
        this.scale.set(1)
    }
}
