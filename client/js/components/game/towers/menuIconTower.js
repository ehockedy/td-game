import { BaseNonInteractiveTower } from "./base/baseNonInteractiveTower.js"

// Tower class that represents thestatic icon behind every icon on the menu
export class MenuIconTower extends BaseNonInteractiveTower {
    constructor(type, name, towerConfig) {
        super(type, name, towerConfig)

        // Make it look like the tower icon has been moved by making this icon black so it looks like a gap
        // Some tower types have a contains with multiple sub-sprites for animation purposes
        if (this.towerSprite.children.length > 0) {
            this.towerSprite.children.forEach(child => {
                child.tint = "0x000000"
            });
        } else {
            this.towerSprite.tint = "0x000000"
        }
        this.towerColourSprite.tint = "0x000000"
    }
}