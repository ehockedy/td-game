import { BaseComponent } from "../base/baseComponent.js"
import { rightEndedHorizontalMenuOption, doubleEndedHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"

// A class that represents a menu that starts on the right of the screen
export class HorizontalOptionsMenu extends BaseComponent {
    constructor(name, x, y) {
        super(name)
        this.x = x
        this.y = y
        this.x_offset = 0
    }

    addRoot(width, tint) {
        return new rightEndedHorizontalMenuOption(this.name+"_root", 0, 0,  width, tint)
    }

    addOption(width, tint) {
        let newOption = new doubleEndedHorizontalMenuOption(this.name+this.children.length.toString(), this.getLocalBounds().width + this.x_offset, 0,  width, tint)
        return newOption
    }

    addButtonOption(width, tint, buttonTextStyle, buttonText, onSelectEventName) {
        let option = this.addOption(width, tint)
        let content = new PIXI.Text(buttonText, buttonTextStyle)
        option.setTextCentral(content)
        option.setClickable()
        option.on("selected", () => {
            this.observers.forEach((observer) => {observer.emit(onSelectEventName)})
        })
        return option
    }

    setOffset(x) {
        // For every child added, offset the position by this much
        // Must be called before the children are added
        this.x_offset = x
    }
}