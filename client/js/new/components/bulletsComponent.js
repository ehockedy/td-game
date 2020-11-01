import { BaseComponent } from "./base/baseComponent.js"
import { gridPosToMapPos } from "../../tools.js"
import { DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y } from "../../views/constants.js"

export class BulletsComponent extends BaseComponent {
    constructor(sprite_handler) {
        super(sprite_handler)
        this.bulletStateHashPrev = ""
        this.bulletSpriteSheet = {}
    }

    registerContainer() {
        super.registerContainer()
        this.loadSpriteSheetData()
    }

    loadSpriteSheetData() {
        let texture = PIXI.Loader.shared.resources["client/img/bullet_spritesheet.png"].texture
        this.bulletSpriteSheet["basic"] = []
        this.bulletSpriteSheet["basic"].push(new PIXI.Texture(texture, new PIXI.Rectangle(0, 0, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y)))
    }

    addBullet(name, type) {
        let bulletSprite = new PIXI.AnimatedSprite(this.bulletSpriteSheet["basic"])
        bulletSprite.name = name
        bulletSprite.anchor.set(0.5)
        this.container.addChild(bulletSprite)
    }

    update(bulletUpdate) {
        this.container.removeChildren() // This only works for bullets as they have no animation - othersiwe would have to keep track of the position in animation loop
        bulletUpdate["objects"].forEach((bullet) => {
            this.addBullet(bullet.name, "TODO") // New bullet
    
            // Move bullet
            let newpos = gridPosToMapPos(bullet.position)
            this.container.getChildByName(bullet.name).x = newpos[0]
            this.container.getChildByName(bullet.name).y = newpos[1]
        })
    }
}