import { BaseComponent } from "./base/baseComponent.js"
import { gridPosToMapPos } from "../../tools.js"

// Array of offset magnitudes to apply to an enemy when hit
// The angle is determined by the direction the enemy is facing
let hitSequence = []
for (let i=1; i <= 3; i++) {
    hitSequence.push(i)
}
for (let i=3; i >= -3; i--) {
    hitSequence.push(i)
}
for (let i=-3; i <= 0; i++) {
    hitSequence.push(i)
}

class Enemy extends BaseComponent {
    constructor(name, textures) {
        super(name)
        this.animatedEnemySprite = new PIXI.AnimatedSprite(textures)
        this.animatedEnemySprite.loop = true
        this.animatedEnemySprite.anchor.set(0.5)
        this.animatedEnemySprite.animationSpeed = 0.5
        this.animatedEnemySprite.play()
        this.addChild(this.animatedEnemySprite)

        this.tickCount = 0
    }
}

export class EnemiesComponent extends BaseComponent {
    constructor(spriteSize, spriteSizeMap) {
        super()
        this.spriteSize = spriteSize
        this.spriteSizeMap = spriteSizeMap
        this.enemyStateHashPrev = ""
        this.enemyTextures = {}

        // Load textures for creating collision anmation
        let explosion1Textures = PIXI.Loader.shared.resources["client/assets/collisions/collision1/collision1.json"].textures
        this.collisionTextures = []
        for (const texture of Object.values(explosion1Textures)) {
            this.collisionTextures.push(texture)
        }
    }

    loadData() {
        return new Promise((resolve) => {
            console.log("enemies")
            fetch("shared/json/enemies.json").then((response) => {
                response.json().then((enemyJson) => {
                    // Load enemy sprite data once config loaded, instead of at start
                    let loader = new PIXI.Loader()

                    // Load textures using filename in config for each type of enemy
                    for (let type in enemyJson) {
                        console.log("adding ", enemyJson[type].textureAtlasFile)
                        loader.add(enemyJson[type].textureAtlasFile)
                    }

                    loader.load(() => {
                        for (let type in enemyJson) {
                            this.enemyTextures[type] = []
                            for (const textureValue of Object.values(loader.resources[enemyJson[type].textureAtlasFile].textures)) {
                                this.enemyTextures[type].push(textureValue)
                            }
                        }
                        resolve()
                    })
                })
            })
        })
    }

    /**
     * Add enemy with stats based off the type
     * @param {String} name Unique name of the enemy object
     * @param {Number} type Type of enemy
     */
    addEnemy(name, type) {
        this.addChild(new Enemy(name, this.enemyTextures[type]))
    }

    generateEnemyHitAnimation(angle) {
        let collisionAnimation = new PIXI.AnimatedSprite(this.collisionTextures)
        collisionAnimation.loop = false
        collisionAnimation.anchor.set(0.5)
        collisionAnimation.animationSpeed = 1
        collisionAnimation.play()
        collisionAnimation.onComplete = () => {
            collisionAnimation.destroy()
        }
        collisionAnimation.x = (10 + Math.random()*5) * Math.cos(angle)
        collisionAnimation.y = (10 + Math.random()*5) * Math.sin(angle)
        collisionAnimation.rotation = Math.random() * Math.PI * 2
        return collisionAnimation
    }

    update(enemyUpdate) {
        // Update position of any enemies
        // If enemy is not present, it has either been killed or reached the end of the path - so remove from container
        // We do this instead of a "kill this enemy" update in case the message does not come through or have two
        // server messages and one client render

        if (enemyUpdate.length == 0) return;

        let enemyStateObjects = enemyUpdate["objects"];
        let enemyStateHash = enemyUpdate["hash"];

        // Remove any enemies not present in server update
        // Add any enemies present in server update and not present in container
        // Only update if there has been a change to the enemy hash
        if (enemyStateHash != this.enemyStateHashPrev) { // TODO further optimisation - hash of all added and removed enemies
            this.enemyStateHashPrev = enemyStateHash

            for (let enemySpriteIdx = this.children.length - 1; enemySpriteIdx >= 0; enemySpriteIdx--) {
                let found = false
                for (let nameIdx = 0; nameIdx < enemyStateObjects.length; nameIdx++) {
                    // Whether enemy is found in this.container, but not in server update
                    found = (this.children[enemySpriteIdx].name == enemyStateObjects[nameIdx].name)
                    if (found) break; // Think this is ok
                }

                // An enemy is not present in update from server, must have been destroyed
                // Remove it and put an explosion animation where it last was
                if (!found) {
                    let removedChild = this.removeChildAt(enemySpriteIdx)
                    let finalExplosion = this.generateEnemyHitAnimation(0)
                    finalExplosion.position = removedChild.position
                    finalExplosion.scale.set(2)
                    this.addChild(finalExplosion)
                }
            }

            // Add any enemies not present in container i.e. just spawned
            for (let nameIdx = 0; nameIdx < enemyStateObjects.length; nameIdx++) {
                let found = false;
                for (let enemySpriteIdx = this.children.length - 1; enemySpriteIdx >= 0; enemySpriteIdx--) {
                    // Whether enemy if found in server update, but not in this.container
                    found = (this.children[enemySpriteIdx].name == enemyStateObjects[nameIdx].name)
                    if (found) break;
                }
                if (!found) this.addEnemy(enemyStateObjects[nameIdx].name, enemyStateObjects[nameIdx].type)
            }
        }

        // Update state of enemies present in server update
        enemyStateObjects.forEach((enemy, idx) => {
            // Move the enemy
            let enemyToUpdate = this.getChildByName(enemy.name)
            let newpos = gridPosToMapPos(enemy.position, this.spriteSizeMap, enemy.position.subgridSize)
            enemyToUpdate.x = newpos[0]
            enemyToUpdate.y = newpos[1]
            enemyToUpdate.animatedEnemySprite.angle = enemy.rotation

            // Add an animation for each hit, if any
            enemy.collisionAngles.forEach((angle) => {
                let anim = this.generateEnemyHitAnimation(angle)
                enemyToUpdate.addChild(anim)
            })

            // Trigger animation sequence if hit by bullet
            if (enemy.isHit) {
                if (enemyToUpdate.tickCount == 0) {
                    enemyToUpdate.tickCount = hitSequence.length
                }
            }

            if (enemyToUpdate.tickCount > 0) {
                enemyToUpdate.animatedEnemySprite.tint = 0xFFCCCC
                enemyToUpdate.tickCount -= 1
                // TODO fix the bug where animation is not quite right when enemy is moving directly up
                // This is because the angle of rotation goes from 315 to -45
                enemyToUpdate.x += hitSequence[enemyToUpdate.tickCount] * Math.sin(enemyToUpdate.animatedEnemySprite.angle)
                enemyToUpdate.y += hitSequence[enemyToUpdate.tickCount] * Math.cos(enemyToUpdate.animatedEnemySprite.angle)
            } else {
                enemyToUpdate.animatedEnemySprite.tint = 0xFFFFFF
            }
        })
    }
}