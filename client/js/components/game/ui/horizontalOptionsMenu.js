import { BaseComponent } from "../base/baseComponent.js"
import { rightEndedHorizontalMenuOption, doubleEndedHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"

// A class that represents a menu that starts on the right of the screen
export class HorizontalOptionsMenu extends BaseComponent {
    constructor(name, x, y, width, tint) {
        super(name)
        this.x = x
        this.y = y
        this.x_offset = 0

        this.menuRoot = new rightEndedHorizontalMenuOption(name+"_root", 0, 0,  width, tint)
        this.addChild(this.menuRoot)
    }

    addOption(width, tint) {
        let newOption = new doubleEndedHorizontalMenuOption(this.name+this.children.length.toString(), this.getLocalBounds().width + this.x_offset, 0,  width, tint)
        this.addChild(newOption)
        return newOption
    }

    setOffset(x) {
        // For every child added, offset the position by this much
        // Must be called before the children are added
        this.x_offset = x
    }
}