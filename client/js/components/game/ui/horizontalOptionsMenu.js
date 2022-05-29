import { BaseComponent } from "../base/baseComponent.js"
import { StaticHorizontalMenuOption, ButtonHorizontalMenuOption, SwitchHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { COLOURS, boldTextStyle } from "../../ui_common/style.js"

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

    _getNextYPosition() {
        return this.getLocalBounds().height * this.buildDirectionMultiplier + (this.children.length ? this.children[0].height : 0) * this.optionsOffset + this.gap
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
        let width = 90
        let tint = COLOURS.CANCEL_RED
        let option = new ButtonHorizontalMenuOption(this.name + "_cancel",
            this._getNextXPosition(width) - (this.gap*0.5), 0,
            width, tint, "none", "half")
        option.setSelectEventName("cancel")
        this.addChild(option)
        option.subscribe(this)
        option.addTextCentral("\u{2715}", boldTextStyle(COLOURS.BLACK, 32))

        let scale = 0.8
        option.setDefaultScale(scale)
        return option
    }

    addBackAndCancelButtons() {
        const width = 90
        const fontSize = 32
        let tint = COLOURS.CANCEL_RED
        let xPos = this._getNextXPosition(width)

        let backOption = new ButtonHorizontalMenuOption(this.name + "_back",
            xPos - (this.gap*0.5), 0,
            width, tint, "none", "half")
        backOption.setSelectEventName("back")
        backOption.addTextCentral("\u{1f814}", boldTextStyle(COLOURS.BLACK, fontSize))
        backOption.subscribe(this)
        this.addChild(backOption)

        let cancelOption = new ButtonHorizontalMenuOption(this.name + "_cancel",
            xPos - (this.gap*0.5), 0,
            width, tint, "none", "half")
        cancelOption.setSelectEventName("cancel")
        cancelOption.addTextCentral("\u{2715}", boldTextStyle(COLOURS.BLACK, fontSize))
        cancelOption.subscribe(this)
        this.addChild(cancelOption)

        let scale = 0.8
        cancelOption.setDefaultScale(scale)
        backOption.setDefaultScale(scale)
        backOption.y += backOption.height
        backOption.x += this.gap
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
    addOption(size, tint, onSelectEventName, isHorizonal=true) {
        let option = new ButtonHorizontalMenuOption(this.name + "_root",
        isHorizonal ? this._getNextXPosition(size) : 0,  // x
        isHorizonal ? 0 : this._getNextYPosition(),  // y
        size, tint, "none")
        option.onSelectEventName = onSelectEventName
        this.addChild(option)
        option.subscribe(this)
        return option
    }

    _setUpInteraction() {
        // "selected" is a generic event emitted by the clickable options - forward the specific event to the subscribers to this menu
        // this means the buttons do not need any subscribers other than this menu
        this.on("selected", (option) => {
            this.observers.forEach((observer) => { observer.emit(option.onSelectEventName, option.params) })
        })
    }

    addInteractionEvent(event, fn) {
        this.on(event, fn)
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

