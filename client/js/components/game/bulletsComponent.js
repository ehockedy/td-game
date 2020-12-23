import { BaseComponent } from "./base/baseComponent.js"
import { gridPosToMapPos } from "../../tools.js"

export class BulletsComponent extends BaseComponent {
    constructor(spriteSize, subgridSize) {
        super()
        this.spriteSize = spriteSize
        this.subgridSize = subgridSize
        this.bulletStateHashPrev = ""
        this.bulletSpriteSheet = {}
    }

    loadData() {
        let texture = PIXI.Loader.shared.resources["client/img/bullet_spritesheet.png"].texture
        this.bulletSpriteSheet["basic"] = []
        this.bulletSpriteSheet["basic"].push(new PIXI.Texture(texture, new PIXI.Rectangle(0, 0, this.spriteSize, this.spriteSize)))
    }

    addBullet(name, type) {
        let bulletSprite = new PIXI.AnimatedSprite(this.bulletSpriteSheet["basic"])
        bulletSprite.name = name
        bulletSprite.anchor.set(0.5)
        this.addChild(bulletSprite)
    }

    update(bulletUpdate) {
        this.removeChildren() // This only works for bullets as they have no animation - othersiwe would have to keep track of the position in animation loop
        bulletUpdate["objects"].forEach((bullet) => {
            this.addBullet(bullet.name, "TODO") // New bullet
    
            // Move bullet
            let newpos = gridPosToMapPos(bullet.position, this.spriteSize, this.subgridSize)
            this.getChildByName(bullet.name).x = newpos[0]
            this.getChildByName(bullet.name).y = newpos[1]
        })
    }
}