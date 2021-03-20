import { BaseComponent } from "../base/baseComponent.js"
import { StaticHorizontalMenuOption, ButtonHorizontalMenuOption, SwitchHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"

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


// A group of independent buttons
export class ButtonMenu extends Menu {
    constructor(name, x, y, buildDirection, gap=0) {
        super(name, x, y, buildDirection, gap)
        this._setUpInteraction()
    }

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
        this.on("selected", (option) => {
            this.observers.forEach((observer) => { observer.emit(option.onSelectEventName) })
        })
    }
}


// Holds a set of options, with one being able to be preessed at a time
// Handles the interactions between the buttons
// If one is pressed, the currently pressed one is deselected
export class SwitchMenu extends Menu {
    constructor(name, x, y, buildDirection, gap=0) {
        super(name, x, y, buildDirection, gap)
        this._setUpInteraction()
    }

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
        this.on("selected", (option) => {
            if (this.selected) this.selected.unsetActive()
            this.selected = option
            this.observers.forEach((observer) => { observer.emit(option.onSelectEventName) })
        })
    }
}

