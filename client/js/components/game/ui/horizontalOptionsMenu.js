import { BaseComponent } from "../base/baseComponent.js"
import { HorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"

// A class that represents a menu that starts on the right of the screen
export class HorizontalOptionsMenu extends BaseComponent {
    constructor(name, x, y) {
        super(name)
        this.x = x
        this.y = y
        this.x_offset = 0
    }

    // Left root because it exists as the left most element, but right-ended option because the visible edge is on the right
    addLeftRoot(width, tint) {
        return new HorizontalMenuOption(this.name+"_root", 0, 0,  width, tint, "left")
    }

    addRightRootButton(width, tint, onSelectEventName) {
        let root = new HorizontalMenuOption(this.name+"_root", 0, 0,  width, tint, "right")
        this._makeButton(root, onSelectEventName)
        return root
    }

    addOption(width, tint) {
        let newOption = new HorizontalMenuOption(this.name+this.children.length.toString(), this.getLocalBounds().width + this.x_offset, 0,  width, tint, "none")
        return newOption
    }

    addButtonOption(width, tint, buttonTextStyle, buttonText, onSelectEventName) {
        let option = this.addOption(width, tint)
        let content = new PIXI.Text(buttonText, buttonTextStyle)
        option.setTextCentral(content)
        this._makeButton(option, onSelectEventName)
        return option
    }

    _makeButton(option, onSelectEventName) {
        option.setClickable()
        option.on("selected", () => {
            this.observers.forEach((observer) => {observer.emit(onSelectEventName)})
        })
    }

    setOffset(x) {
        // For every child added, offset the position by this much
        // Must be called before the children are added
        this.x_offset = x
    }
}