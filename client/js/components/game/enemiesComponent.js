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

export class EnemiesComponent extends BaseComponent {
    constructor(spriteSize, spriteSizeMap) {
        super()
        this.spriteSize = spriteSize
        this.spriteSizeMap = spriteSizeMap
        this.enemyStateHashPrev = ""
        this.enemyTextures = {}
    }

    loadData() {
        return new Promise((resolve) => {
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
        let animatedEnemySprite = new PIXI.AnimatedSprite(this.enemyTextures[type])
        animatedEnemySprite.loop = true
        animatedEnemySprite.anchor.set(0.5)
        animatedEnemySprite.animationSpeed = 0.5
        animatedEnemySprite.play()
        animatedEnemySprite.name = name // Unique identifier
        animatedEnemySprite.tickCount = 0
        this.addChild(animatedEnemySprite)
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
                if (!found) this.removeChildAt(enemySpriteIdx);
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
            enemyToUpdate.angle = enemy.rotation

            // Trigger animation sequence if hit by bullet
            if (enemy.isHit) {
                if (enemyToUpdate.tickCount == 0) {
                    enemyToUpdate.tickCount = hitSequence.length
                }
            }

            if (enemyToUpdate.tickCount > 0) {
                enemyToUpdate.tint = 0xFFCCCC
                enemyToUpdate.tickCount -= 1
                // TODO fix the bug where animation is not quite right when enemy is moving directly up
                // This is because the angle of rotation goes from 315 to -45
                enemyToUpdate.x += hitSequence[enemyToUpdate.tickCount] * Math.sin(enemyToUpdate.angle)
                enemyToUpdate.y += hitSequence[enemyToUpdate.tickCount] * Math.cos(enemyToUpdate.angle)
            } else {
                enemyToUpdate.tint = 0xFFFFFF
            }
        })
    }
}