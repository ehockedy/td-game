import { BaseComponent } from "./base/baseComponent.js"
import { gridPosToMapPos } from "../../tools.js"

const flameStartingScale = 0.6

export class BulletsComponent extends BaseComponent {
    constructor(spriteSize, spriteSizeMap, bulletConfig) {
        super()
        this.spriteSize = spriteSize
        this.spriteSizeMap = spriteSizeMap
        this.bulletStateHashPrev = ""
        this.bulletConfig = bulletConfig
        this.bulletTextures = this.loadBulletTextures()
    }

    loadBulletTextures() {
        let bulletTextures = {}
        let textures = PIXI.Loader.shared.resources["client/assets/bullets/bullets.json"].textures

        // Load textures using keyword in each filename for each type of bullet
        for (let type in this.bulletConfig) bulletTextures[type] = []

        // Identify if the texture file name is one of the types in the json config, add to the texture dictionary if so
        for (let textureName in textures) {
            for (let type in this.bulletConfig) {
                if (textureName.includes(this.bulletConfig[type].filenameKeyword)) {
                    bulletTextures[type].push(textures[textureName])
                }
            }
        }
        return bulletTextures
    }

    addBullet(name, type, x, y, angle) {
        if (type == "buzzsaw") return // Some bullet types are not shown
        let bulletSprite = new PIXI.Sprite(this.bulletTextures[type][Math.floor(Math.random() * this.bulletTextures[type].length)])
        bulletSprite.name = name
        bulletSprite.anchor.set(0.5)
        bulletSprite.toRemove = false
        bulletSprite.x = x
        bulletSprite.y = y
        bulletSprite.rotation = angle
        bulletSprite.updateTicks = 0

        // Flame bullets grow as they move, this is the starting scale
        if (type == "flame") {
            bulletSprite.scale.set(flameStartingScale)
        }
        this.addChild(bulletSprite)
        return bulletSprite
    }

    update(bulletUpdate) {
        // Go through the bullets in the list from the server and add them or update positions if exist already
        bulletUpdate["objects"].forEach((bulletNew) => {
            let newpos = gridPosToMapPos(bulletNew.position, this.spriteSizeMap, bulletNew.position.subgridSize)
            let bulletFound = false
            for (let bulletIdx=0; bulletIdx < this.children.length; bulletIdx += 1) {
                let bullet = this.children[bulletIdx]
                if (bulletNew.name == bullet.name) {
                    bullet.x = newpos[0]
                    bullet.y = newpos[1]
                    if (this.bulletConfig[bulletNew.type].rotate) {
                        bullet.angle += this.bulletConfig[bulletNew.type].rotationSpeed
                    } else {
                        bullet.rotation = bulletNew.angle
                    }
                    bullet.toRemove = false
                    bullet.updateTicks += 1
                    if (bulletNew.type == "flame") {
                        bullet.alpha = 1 - bullet.updateTicks*0.01
                        bullet.scale.set(flameStartingScale + bullet.updateTicks*0.015)
                    }
                    bulletFound = true
                    break
                }
            }
            if (!bulletFound) {
                this.addBullet(bulletNew.name, bulletNew.type, newpos[0], newpos[1], bulletNew.angle)
            }
        })

        for (let bulletIdx = this.children.length - 1; bulletIdx >=0 ; bulletIdx -= 1) {
            let bullet = this.children[bulletIdx]
            if (bullet.toRemove) this.removeChild(bullet)
            else bullet.toRemove = true  // Set to true, on the next update mark as not for removal once bullet seen in update
        }
    }
}