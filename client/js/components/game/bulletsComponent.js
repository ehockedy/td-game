import { BaseComponent } from "./base/baseComponent.js"
import { gridPosToMapPos } from "../../tools.js"

export class BulletsComponent extends BaseComponent {
    constructor(spriteSize, spriteSizeMap) {
        super()
        this.spriteSize = spriteSize
        this.spriteSizeMap = spriteSizeMap
        this.bulletStateHashPrev = ""
        this.rockBullets = []
    }

    loadData() {
        let textures = PIXI.Loader.shared.resources["client/img/bullets/bullets.json"].textures
        for (let textureName in textures) {
            if (textureName.includes("rock")) this.rockBullets.push(textures[textureName])
        }
    }

    addBullet(name, type) {
        let bulletSprite = new PIXI.Sprite(this.rockBullets[Math.floor(Math.random() * this.rockBullets.length)])
        bulletSprite.name = name
        bulletSprite.anchor.set(0.5)
        bulletSprite.toRemove = false
        this.addChild(bulletSprite)
    }

    update(bulletUpdate) {
        //this.children.forEach((bullet) => { bullet.toRemove = true }) // Mark as ready for removal, will be set to false if a bullet with same name is in update

        // Go through the bullets in the list from the server and add them or update positions if exist already
        bulletUpdate["objects"].forEach((bulletNew) => {
            let newpos = gridPosToMapPos(bulletNew.position, this.spriteSizeMap, bulletNew.position.subgridSize)
            let bulletFound = false
            for (let bulletIdx=0; bulletIdx < this.children.length; bulletIdx += 1) {
                let bullet = this.children[bulletIdx]
                if (bulletNew.name == bullet.name) {
                    bullet.x = newpos[0]
                    bullet.y = newpos[1]
                    bullet.angle += 5
                    bullet.toRemove = false
                    bulletFound = true
                    break
                }
            }
            if (!bulletFound) {
                this.addBullet(bulletNew.name, "TODO") // New bullet
            }
        })

        for (let bulletIdx = this.children.length - 1; bulletIdx >=0 ; bulletIdx -= 1) {
            let bullet = this.children[bulletIdx]
            if (bullet.toRemove) this.removeChild(bullet)
            else bullet.toRemove = true  // Set to true, on the next update mark as not for removal once bullet seen in update
        }
    }
}