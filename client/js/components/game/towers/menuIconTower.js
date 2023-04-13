import { BaseNonInteractiveTower } from "./base/baseNonInteractiveTower.js"
import { plainTextStyle, COLOURS } from '../../ui_common/style.js'

// Tower class that represents thestatic icon behind every icon on the menu
export class MenuIconTower extends BaseNonInteractiveTower {
    constructor(type, name, towerConfig) {
        super(type, name, towerConfig, "0xFFFFFF")

        // Make it look like the tower icon has been moved by making this icon black so it looks like a gap
        // Some tower types have a contains with multiple sub-sprites for animation purposes
        this.setTint("0x000000")

        const cost = new PIXI.Text(towerConfig[type].cost.toString(), plainTextStyle(COLOURS.BLACK, 20))
        cost.anchor.set(.5, 1)
        cost.y = 48
        this.addChild(cost)
    }
}