import { BaseComponent } from "../../base/baseComponent.js"

export class DeployedTowerButton extends BaseComponent {
    constructor(name, distFromTower, rotation, scale, tint) {
        super(name)

        let baseTexture = PIXI.Loader.shared.resources["client/assets/infoBoxes/towerPopup/towerPopup.json"].textures["button1.png"]

        this.shadow = new PIXI.Sprite(baseTexture)
        this.shadow.tint = "0x000000"
        this.shadow.anchor.set(0, 0.5)
        this.shadow.pivot.set(-distFromTower, 0)
        this.shadow.x += 5
        this.shadow.y += 5
        this.shadow.rotation = rotation
        this.shadow.alpha = 0.7
        this.shadow.scale.set(scale)
        this.addChild(this.shadow)

        this.button = new PIXI.Sprite(baseTexture)
        this.button.tint = tint
        this.button.anchor.set(0, 0.5)
        this.button.pivot.set(-distFromTower, 0)
        this.button.rotation = rotation
        this.button.scale.set(scale)
        this.addChild(this.button)
    }
}