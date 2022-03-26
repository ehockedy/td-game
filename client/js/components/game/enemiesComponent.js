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
    constructor(name, textures, type) {
        super(name)
        this.type = type
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
    constructor(spriteSize, spriteSizeMap, enemyConfig) {
        super()
        this.spriteSize = spriteSize
        this.spriteSizeMap = spriteSizeMap
        this.enemyStateHashPrev = ""
        this.enemyTextures = {}

        // Containers
        this.enemySprites = new PIXI.Container()
        this.deathSprites = new PIXI.Container()
        this.endOfPathEnemies = new PIXI.Container()
        this.addChild(this.enemySprites)
        this.addChild(this.deathSprites)
        this.addChild(this.endOfPathEnemies)

        // Load textures for creating collision anmation
        let explosion1Textures = PIXI.Loader.shared.resources["client/assets/collisions/collision1/collision1.json"].textures
        this.collisionTextures = []
        for (const texture of Object.values(explosion1Textures)) {
            this.collisionTextures.push(texture)
        }
        this.enemyConfig = enemyConfig
        this.enemyTextures = this.loadEnemyTextures()
    }

    // Cache a map of textures for a given enemy
    loadEnemyTextures() {
        let enemyTextures = {}
        for (let type in this.enemyConfig) {
            enemyTextures[type] = []
            for (const textureValue of Object.values(PIXI.Loader.shared.resources[this.enemyConfig[type].textureAtlasFile].textures)) {
                enemyTextures[type].push(textureValue)
            }
        }
        return enemyTextures
    }

    /**
     * Add enemy with stats based off the type
     * @param {String} name Unique name of the enemy object
     * @param {Number} type Type of enemy
     */
    addEnemy(name, type) {
        this.enemySprites.addChild(new Enemy(name, this.enemyTextures[type], type))
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
        let enemyStateObjects = enemyUpdate["objects"];
        let enemyStateHash = enemyUpdate["hash"];

        // Remove any enemies not present in server update
        // Add any enemies present in server update and not present in container
        // Only update if there has been a change to the enemy hash
        if (enemyStateHash != this.enemyStateHashPrev) { // TODO further optimisation - hash of all added and removed enemies
            this.enemyStateHashPrev = enemyStateHash

            for (let enemySpriteIdx = this.enemySprites.children.length - 1; enemySpriteIdx >= 0; enemySpriteIdx--) {
                let found = false
                for (let nameIdx = 0; nameIdx < enemyStateObjects.length; nameIdx++) {
                    // Whether enemy is found in this.container, but not in server update
                    found = (this.enemySprites.children[enemySpriteIdx].name == enemyStateObjects[nameIdx].name)
                    if (found) break; // Think this is ok
                }

                // An enemy is not present in update from server, must have been destroyed
                // Remove it and put an explosion animation where it last was
                if (!found) {
                    let removedChild = this.enemySprites.removeChildAt(enemySpriteIdx)
                    let finalExplosion = this.generateEnemyHitAnimation(0)
                    finalExplosion.position = removedChild.position
                    finalExplosion.scale.set(2)
                    finalExplosion.animationSpeed = 0.8
                    this.deathSprites.addChild(finalExplosion)
                }
            }

            // Add any enemies not present in container i.e. just spawned
            for (let nameIdx = 0; nameIdx < enemyStateObjects.length; nameIdx++) {
                let found = false;
                for (let enemySpriteIdx = this.enemySprites.children.length - 1; enemySpriteIdx >= 0; enemySpriteIdx--) {
                    // Whether enemy if found in server update, but not in this.container
                    found = (this.enemySprites.children[enemySpriteIdx].name == enemyStateObjects[nameIdx].name)
                    if (found) break;
                }
                if (!found) this.addEnemy(enemyStateObjects[nameIdx].name, enemyStateObjects[nameIdx].type)
            }
        }

        // Update state of enemies present in server update
        enemyStateObjects.forEach((enemy) => {
            // This enemy has reached the end of the path without getting killed, so remove the sprite without a death animation.
            // Move it to a separate container that holds all the enemies that reached the end of the path.
            if (enemy.hasReachedEnd) {
                let existingEnemySprite = this.enemySprites.removeChild(this.enemySprites.getChildByName(enemy.name))

                // Position the enemy
                let newpos = gridPosToMapPos(enemy.position, this.spriteSizeMap, enemy.position.subgridSize)
                existingEnemySprite.x = newpos[0]
                existingEnemySprite.y = newpos[1]
                existingEnemySprite.angle = Math.random() * Math.PI/4 - (Math.PI/8)  // Random angle that goes into the camp
                existingEnemySprite.animatedEnemySprite.rotation = existingEnemySprite.angle
                this.endOfPathEnemies.addChild(existingEnemySprite)
                return  // Don't need to do anything else for this enemy
            }

            // Move the enemy
            let enemyToUpdate = this.enemySprites.getChildByName(enemy.name)
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

    updateEndOfPathEnemies(edgeX) {
        // Update the sprites that move regardless of state coming from server
        // Update positions of enemies that have reached the camp
        for (let enemyIdx = this.endOfPathEnemies.children.length - 1; enemyIdx >= 0; enemyIdx--) {
            let enemy = this.endOfPathEnemies.getChildAt(enemyIdx)
            enemy.x += Math.cos(enemy.angle) * this.enemyConfig[enemy.type].speed
            enemy.y += Math.sin(enemy.angle) * this.enemyConfig[enemy.type].speed
            if (enemy.x > edgeX + enemy.animatedEnemySprite.width) {
                this.endOfPathEnemies.removeChildAt(enemyIdx)
            }
        }
    }
}