import { StaticHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { generateStyle } from "./deployedTowerMenu.js"

let startMenuColour = "0xAABB99"
export class LivesCounter extends StaticHorizontalMenuOption {
    constructor(x, y) {
        super("lives", x, y, 160, startMenuColour, "right")

        this.label = new PIXI.Text("Lives", generateStyle(startMenuColour, 30))
        this.label.anchor.set(0.5)
        this.addText(this.label, 0.6, 0.25)

        this.lives = new PIXI.Text("", generateStyle(startMenuColour, 40))
        this.lives.anchor.set(0.5)
        this.addText(this.lives, 0.6, 0.68)
        this.update("100")  // Populate with initial number of lives
    }

    update(livesRemaining) {
        this.lives.text = livesRemaining.toString()
    }
}