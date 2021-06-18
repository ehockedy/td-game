import { BaseComponent } from "./base/baseComponent.js"
import { gridPosToMapPos } from "../../tools.js"

export class BulletsComponent extends BaseComponent {
    constructor(spriteSize, spriteSizeMap) {
        super()
        this.spriteSize = spriteSize
        this.spriteSizeMap = spriteSizeMap
        this.bulletStateHashPrev = ""
        this.bulletTextures = {}
    }

    loadData() {
        let _this = this
        return new Promise((resolve) => {
            fetch("shared/json/bullets.json").then((response) => {
                response.json().then((data) => {
                    _this.bulletJson = data
                    let textures = PIXI.Loader.shared.resources["client/assets/bullets/bullets.json"].textures

                    // Load textures using keyword in each filename for each type of bullet
                    for (let type in _this.bulletJson) this.bulletTextures[type] = []

                    // Identify if the texture file name is one of the types in the json config, add to the texture dictionary if so
                    for (let textureName in textures) {
                        for (let type in _this.bulletJson) {
                            if (textureName.includes(_this.bulletJson[type].filenameKeyword)) this.bulletTextures[type].push(textures[textureName])
                        }
                    }
                    resolve()
                })
            })
        })
    }

    addBullet(name, type) {
        let bulletSprite = new PIXI.Sprite(this.bulletTextures[type][Math.floor(Math.random() * this.bulletTextures[type].length)])
        bulletSprite.name = name
        bulletSprite.anchor.set(0.5)
        bulletSprite.toRemove = false
        this.addChild(bulletSprite)
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
                    if (this.bulletJson[bulletNew.type].rotate) {
                        bullet.angle += this.bulletJson[bulletNew.type].rotationSpeed
                    } else {
                        bullet.rotation = bulletNew.angle
                        
                    }
                    bullet.toRemove = false
                    bulletFound = true
                    break
                }
            }
            if (!bulletFound) {
                this.addBullet(bulletNew.name, bulletNew.type) // New bullet
            }
        })

        for (let bulletIdx = this.children.length - 1; bulletIdx >=0 ; bulletIdx -= 1) {
            let bullet = this.children[bulletIdx]
            if (bullet.toRemove) this.removeChild(bullet)
            else bullet.toRemove = true  // Set to true, on the next update mark as not for removal once bullet seen in update
        }
    }
}