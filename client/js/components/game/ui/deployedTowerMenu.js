import { HorizontalOptionsMenu } from "./horizontalOptionsMenu.js"

export class DeployedTowerMainMenu extends HorizontalOptionsMenu {
    constructor(x, y) {
        super("deployedTowerMainMenu", x, y, 300, "0x22FF33")
        this.setOffset(-20)
        this.addOption(200, "0x2277fd")
    }
}
