import { StaticHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { boldTextStyle, plainTextStyle, COLOURS } from "../../ui_common/style.js"

export class Counter extends StaticHorizontalMenuOption {
    constructor(x, y, width, label, defaultValue, colour=COLOURS.INFO_MID_GREY) {
        super(label, x, y, width, colour, "right")

        this.label = new PIXI.Text(label, plainTextStyle(COLOURS.BLACK, 36))
        this.label.anchor.set(0.5)
        this.addText(this.label, 0.6, 0.25)

        this.value = new PIXI.Text("", boldTextStyle(colour, 42))
        this.value.anchor.set(0.5)
        this.addText(this.value, 0.6, 0.62)
        this.update(defaultValue)  // Populate with initial number
    }

    update(newValue) {
        if (this.value.text != newValue && !isNaN(newValue)) {
            if (!isNaN(this.value.text)) {
                this.valueChangeAnimation(parseInt(newValue) - parseInt(this.value.text))
            }
            this.value.text = newValue.toString()
        }
    }

    valueChangeAnimation(value) {
        // Triggers an animation showing an increase or decrease in value for the counter
        let colour = value > 0 ? COLOURS.CONFIRM_GREEN : COLOURS.DENY_RED
        let sign = value > 0 ? "+" : ""
        let direction = (value/Math.abs(value))

        let valueChangeText = new PIXI.Text(sign + value.toString() , boldTextStyle(colour, 30))
        valueChangeText.anchor.set(0.5)
        valueChangeText.x = this.baseContentOffsetX + this.menuSprite.width/4 + (Math.random() * this.menuSprite.width * 0.5)
        valueChangeText.y = this.menuSprite.height/2 - 2*direction
        let moveVelocity = 0.5 * direction * -1  // *-1 since negative direction is up on canvas
        this.addChild(valueChangeText)

        // Trigger the animation
        valueChangeText.ticks = 0
        let animation = setInterval(() => {
            valueChangeText.ticks += 1
            valueChangeText.y += moveVelocity
            if (valueChangeText.ticks > 30) valueChangeText.alpha -= 0.03

            // Disappeared, so remove the sprite and stop the animation loop
            if (valueChangeText.alpha <= 0) {
                clearInterval(animation)
                this.removeChild(valueChangeText)
            }
        }, 20)
    }
}
