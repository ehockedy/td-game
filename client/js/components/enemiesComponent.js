import { BaseComponent } from "./base/baseComponent.js"
import { gridPosToMapPos } from "../tools.js"
import { DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y} from "../constants.js"

export class EnemiesComponent extends BaseComponent {
    constructor(sprite_handler) {
        super(sprite_handler)
        this.enemyStateHashPrev = ""

        this.enemySpriteSheet = {}

    }

    loadData() {
        return new Promise((resolve) => {
            let texture = PIXI.Loader.shared.resources["client/img/enemy_spritesheet.png"].texture
            this.enemySpriteSheet["basic"] = []
            for (let i = 0; i < 6; ++i) {
                this.enemySpriteSheet["basic"].push(new PIXI.Texture(texture, new PIXI.Rectangle(0, i * DEFAULT_SPRITE_SIZE_Y, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y)))
            }
            resolve()
        })
    }

    /**
     * Add enemy with stats based off the type
     * @param {String} name Unique name of the enemy object
     * @param {Number} type Type of enemy
     */
    addEnemy(name, type) {
        // TODO have different types
        let animatedEnemySprite = new PIXI.AnimatedSprite(this.enemySpriteSheet["basic"])
        animatedEnemySprite.loop = true
        animatedEnemySprite.anchor.set(0.5)
        animatedEnemySprite.animationSpeed = 0.2
        animatedEnemySprite.play()
        animatedEnemySprite.name = name // Unique identifier
        animatedEnemySprite.tintCount = 0
        this.container.addChild(animatedEnemySprite)
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

            for (let enemySpriteIdx = this.container.children.length - 1; enemySpriteIdx >= 0; enemySpriteIdx--) {
                let found = false
                for (let nameIdx = 0; nameIdx < enemyStateObjects.length; nameIdx++) {
                    // Whether enemy is found in this.container, but not in server update
                    found = (this.container.children[enemySpriteIdx].name == enemyStateObjects[nameIdx].name)
                    if (found) break; // Think this is ok
                }
                if (!found) this.container.removeChildAt(enemySpriteIdx);
            }

            // Add any enemies not present in container i.e. just spawned
            for (let nameIdx = 0; nameIdx < enemyStateObjects.length; nameIdx++) {
                let found = false;
                for (let enemySpriteIdx = this.container.children.length - 1; enemySpriteIdx >= 0; enemySpriteIdx--) {
                    // Whether enemy if found in server update, but not in this.container
                    found = (this.container.children[enemySpriteIdx].name == enemyStateObjects[nameIdx].name)
                    if (found) break;
                }
                if (!found) this.addEnemy(enemyStateObjects[nameIdx].name)
            }
        }

        // Update state of enemies present in server update
        enemyStateObjects.forEach((enemy, idx) => {
            // Move the enemy
            let enemyToUpdate = this.container.getChildByName(enemy.name)
            let newpos = gridPosToMapPos(enemy.position)
            enemyToUpdate.x = newpos[0]
            enemyToUpdate.y = newpos[1]

            // Change tint if hit by bullet
            if (enemy.isHit) {
                enemyToUpdate.tint = 0xCCCCCC
                enemyToUpdate.tintCount = 10 // Number of frames to tint for
            }
            if (enemyToUpdate.tintCount > 0) {
                enemyToUpdate.tintCount -= 1
            } else {
                enemyToUpdate.tint = 0xFFFFFF
            }
        })
    }
}