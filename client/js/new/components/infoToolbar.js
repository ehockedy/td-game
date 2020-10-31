export class InfoToolbar {
    constructor(sprite_handler, width_px, height_px, x, y) {
        this.sprite_handler = sprite_handler
        this.containerName = "towermenu"

        this.width_px = width_px
        this.height_px = height_px
        this.x = x
        this.y = y
    }

    registerContainer() {
        let container = new PIXI.Container(); // The grid all the action takes place in
        container.name = this.containerName

        // Add the toolbar background
        let graphics = new PIXI.Graphics();
        graphics.beginFill("0x727272")
        graphics.drawRect(0, 0, this.width_px, this.height_px)
        container.addChild(graphics)
        container.x = this.x
        container.y = this.y

        this.sprite_handler.registerContainer(container)
    }



    onTowerMenuPointerOver(towerType) {
        console.log("Info toolbar tower menu pointer over", towerType)
    }
}