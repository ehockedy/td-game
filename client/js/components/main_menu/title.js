import { BaseComponent } from "../../components/game/base/baseComponent.js"
import { titleStyle } from "../../styles/text.js"

export class MenuTitle extends BaseComponent {
    constructor(x_px, y_px) {
        super("menuTitle")

        this.textSprite = new PIXI.Text('TOWER DEFENCE!', titleStyle);
        this.textSprite.anchor.set(0.5);
        this.textSprite.x = x_px
        this.textSprite.y = y_px
        this.textSprite.startX = this.textSprite.x
        this.textSprite.startY = this.textSprite.y
        this.textSprite.name = "title"
        this.addChild(this.textSprite);

        this.bounceDir = 1
    }

    bounce() {
        // Make the title "bounce"
        const range = 15
        const speed = 1
        let displacement = this.textSprite.y-this.textSprite.startY
        let displacementProportionOfRange = Math.pow((1 - (range - displacement) / range ), 1)
        let toMove = Math.max(speed * displacementProportionOfRange, 0.01)

        this.textSprite.y += this.bounceDir * toMove

        if (this.textSprite.y > this.textSprite.startY+range) this.bounceDir = -1
        else if (this.textSprite.y < this.textSprite.startY) this.bounceDir = 1

    }

    tick() {
        super.tick()
        this.bounce()
    }
}