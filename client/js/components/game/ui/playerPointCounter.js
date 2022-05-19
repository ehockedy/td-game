import { StaticHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { plainTextStyle, COLOURS } from "../../ui_common/style.js"

export class PlayerPointCounter extends StaticHorizontalMenuOption {
    constructor(x, y, width, label, defaultValue, colour=COLOURS.INFO_MID_GREY) {
        super(label, x, y, width, colour, "right-flipped")

        // Player name
        this.label = new PIXI.Text(label, plainTextStyle(COLOURS.BLACK, 36))
        this.label.anchor.set(1, 0.5)
        this.addText(this.label, 0.95, 0.25)

        // Scale the name so that it does not run over the end of the box
        if (this.label.width > width*0.85) {  // *0.9 to account for margin around text
            this.label.scale.set(0.8*width/this.label.width)  // *0.8 to account for margin around text
        }

        // Player points
        this.value = new PIXI.Text("", plainTextStyle(COLOURS.BLACK, 30))
        this.value.anchor.set(1, 0.5)
        this.addText(this.value, 0.95, 0.62)
        if (this.value.width > width*0.9) {
            this.value.scale.set(0.8*width/this.value.width)
        }
        this.update(defaultValue)  // Populate with initial number

        // Text to display that a player wants to start the round
        this.readyText = new PIXI.Text("Ready!", plainTextStyle(COLOURS.BLACK, 40))
        this.readyText.anchor.set(0.5)
        this.unsetReady()
        this.addText(this.readyText, 0.1, 0.5)

        this.isPlayerDisconnected = false
    }

    update(newValue) {
        if (!(this.value.text === newValue.toString())) {
            this.value.text = newValue.toString()
        }
    }

    setReady() {
        // Angle randomly so looks different for each player
        this.readyText.angle = -15 + (Math.random() * 30)
        this.readyText.visible = true
    }

    unsetReady() {
        this.readyText.visible = false
    }

    isReady() {
        return this.readyText.visible
    }

    setDisconnected(state) {
        this.isPlayerDisconnected = state
        if (this.isPlayerDisconnected) {
            // Tint the colour darker
            this._darken()
        } else {
            this._resetColour()
        }
    }

    isDisconnected() {
        return this.isPlayerDisconnected
    }
}