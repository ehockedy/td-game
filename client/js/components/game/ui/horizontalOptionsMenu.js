import { BaseComponent } from "../base/baseComponent.js"
import { StaticHorizontalMenuOption, ButtonHorizontalMenuOption, SwitchHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { COLOURS } from "../../ui_common/style.js"

// Base class for the game UI menu type
class Menu extends BaseComponent {
    constructor(name, x, y, buildDirection, gap) {
        super(name)
        this.x = x
        this.y = y
        this.gap = gap
        this.buildDirection = buildDirection
        this.buildDirectionMultiplier = this.buildDirection == "right" ? 1 : -1
        this.optionsOffset = this.buildDirection == "right" ? 0 : -1  // If the options go to the left when added, need to offset because pivot if top left corner of button sprite
    }

    addRoot(width, tint) {
        let wallAttachment = this.buildDirection == "right" ? "left" : "right"
        let option = new StaticHorizontalMenuOption(this.name + "_root", 0, 0, width, tint, wallAttachment)
        this.addChild(option)
        return option
    }

    _getNextXPosition(width) {
        return this.getLocalBounds().width * this.buildDirectionMultiplier + width * this.optionsOffset + this.gap
    }
}

// A menu that has no interactive components
export class StaticMenu extends Menu {
    constructor(name, x, y, buildDirection, gap=0) {
        super(name, x, y, buildDirection, gap)
    }

    addOption(width, tint) {
        let option = new StaticHorizontalMenuOption(this.name + "_root",
            this._getNextXPosition(width), 0,
            width, tint, "none")
        this.addChild(option)
        return option
    }
}

class InteractiveMenu extends Menu {
    constructor(name, x, y, buildDirection, gap=0) {
        super(name, x, y, buildDirection, gap)
        this._setUpInteraction()
        this._setUpCancelBackInteraction()
    }

    addCancelButton() {
        let width = 120
        let tint = COLOURS.CANCEL_RED
        let option = new ButtonHorizontalMenuOption(this.name + "_cancel",
            this._getNextXPosition(width), 0,
            width, tint, "none")
        option.setSelectEventName("cancel")
        this.addChild(option)
        option.subscribe(this)
        option.addTextCentral("\u{2717}", {
            "dropShadow": false,
            "dropShadowAngle": 0.7,
            "fill": "0x000000",
            "fontFamily": "\"Trebuchet MS\", Helvetica, sans-serif",
            "fontSize": 32,
            "fontStyle": "normal",
            "fontVariant": "small-caps",
            "letterSpacing": 1,
            "strokeThickness": Math.ceil(32/10)
        })

        let scale = 0.8
        option.y += option.height * (1-scale) / 2
        option.setDefaultScale(scale)
        return option
    }

    addBackButton() {
        let width = 120
        let tint = COLOURS.CANCEL_RED
        let option = new ButtonHorizontalMenuOption(this.name + "_back",
            this._getNextXPosition(width), 0,
            width, tint, "none")
        option.setSelectEventName("back")
        this.addChild(option)
        option.subscribe(this)
        option.addTextCentral("\u{1f814}", {
            "dropShadow": false,
            "dropShadowAngle": 0.7,
            "fill": "0x000000",
            "fontFamily": "\"Trebuchet MS\", Helvetica, sans-serif",
            "fontSize": 40,
            "fontStyle": "normal",
            "fontVariant": "small-caps",
            "letterSpacing": 1,
            "strokeThickness": Math.ceil(32/10)
        })

        let scale = 0.8
        option.y += option.height * (1-scale) / 2
        option.setDefaultScale(scale)
        return option
    }

    // A special interaction setup to listen for the cancel event
    // Handle separately, since it is used in both button and switch menus and do not want to treat it as a normal event
    _setUpCancelBackInteraction() {
        this.on("cancel", () => {
            this.observers.forEach((observer) => { observer.emit("cancel") })
        })
        this.on("back", () => {
            this.observers.forEach((observer) => { observer.emit("back") })
        })
    }
}


// A group of independent buttons
export class ButtonMenu extends InteractiveMenu {
    addOption(width, tint, onSelectEventName) {
        let option = new ButtonHorizontalMenuOption(this.name + "_root",
            this._getNextXPosition(width), 0,
            width, tint, "none")
        option.onSelectEventName = onSelectEventName
        this.addChild(option)
        option.subscribe(this)
        return option
    }

    _setUpInteraction() {
        // "selected" is a generic event emitted by the clickable options - forward the specific event to the subscribers to this menu
        // this means the buttons do not need any subscribers other than this menu
        this.on("selected", (option) => {
            this.observers.forEach((observer) => { observer.emit(option.onSelectEventName) })
        })
    }
}


// Holds a set of options, with one being able to be pressed at a time
// Handles the interactions between the buttons
// If one is pressed, the currently pressed one is deselected
export class SwitchMenu extends InteractiveMenu {
    addOption(width, tint, onSelectEventName, isDefault=false) {
        let option = new SwitchHorizontalMenuOption(this.name + "_root",
            this._getNextXPosition(width), 0,
            width, tint, "none")
        this.addChild(option)
        option.onSelectEventName = onSelectEventName

        // The default button is the one pressed down from the start
        if (isDefault) this.setSelected(option)

        // Set up interaction for if the button is pressed
        option.subscribe(this)
        return option
    }

    setSelected(option) {
        if (this.selected) this.selected.unsetActive()
        this.selected = option
        this.selected.setActive()
    }

    _setUpInteraction() {
        // "selected" is a generic event emitted by the clickable options - forward the specific event to the subscribers to this menu
        // this means the buttons do not need any subscribers other than this menu
        // It also means the menu can have control over the switches when one is pressed
        this.on("selected", (option) => {
            if (this.selected) this.selected.unsetActive()
            this.selected = option
            this.observers.forEach((observer) => { observer.emit(option.onSelectEventName) })
        })
    }
}

