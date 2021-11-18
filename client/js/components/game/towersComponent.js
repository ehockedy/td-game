import { BaseComponent } from "./base/baseComponent.js"
import { DeployedTower } from "./towers/deployedTower.js"

/**
 * This component stores all the information about the towers that are out on the map
 * In future, might be best to remove the sprite creation functions out
 */
export class TowersComponent extends BaseComponent {
    constructor(sprite_handler, mapSpriteSize){
        super()
        this.mapSpriteSize = mapSpriteSize
        this.sprite_handler = sprite_handler
        this.towerStateHashPrev = ""

        this.observers = [this]
        this.setEventListeners()
        this.isSimulation = false
    }

    // Setter for tower config
    setData(towerConfig, playerConfig, thisPlayer) {
        this.towerConfig = towerConfig
        this.playerConfig = playerConfig
        this.thisPlayer = thisPlayer
    }

    setSimulation() {
        this.isSimulation = true
    }

    subscribe(observer) {
        this.observers.push(observer)
    }

    addPlacedTower(type, name, playerID, row, col) {
        const x = col * this.mapSpriteSize + this.mapSpriteSize / 2;
        const y = row * this.mapSpriteSize + this.mapSpriteSize / 2;
        const isThisPlayer = (playerID == this.thisPlayer)
        const colour = (!this.isSimulation) ? this.playerConfig[playerID].colour : "#FFFFFF"
        let sprite = new DeployedTower(type, name, x, y, this.towerConfig, playerID, colour, isThisPlayer)
        if (isThisPlayer) { // TODO check if the playerID exist
            this.observers.forEach((observer) => {sprite.subscribe(observer)})
        }
        this.addChild(sprite)
    }

    update(towerData) {
        let towerStateObjects = towerData["objects"];
        let towerStateHash = towerData["hash"];

        if (towerStateHash != this.towerStateHashPrev) {
            this.towerStateHashPrev = towerStateHash

            // Identify tower not in container but in server update
            for (let nameIdx = 0; nameIdx < towerStateObjects.length; nameIdx++) {
                let found = false;
                for (let towerSpriteIdx = this.children.length - 1; towerSpriteIdx >= 0; towerSpriteIdx--) {
                    found = (this.children[towerSpriteIdx].name == towerStateObjects[nameIdx].name)
                    if (found) break;
                }
                if (!found) {
                    this.addPlacedTower(towerStateObjects[nameIdx].type,
                        towerStateObjects[nameIdx].name,
                        towerStateObjects[nameIdx].playerID,
                        towerStateObjects[nameIdx].position.row,
                        towerStateObjects[nameIdx].position.col)
                }
            }

            // Search for tower in container but not in server update
            for (let towerSpriteIdx = this.children.length - 1; towerSpriteIdx >= 0; towerSpriteIdx--) {
                let found = false;
                for (let towerIdx=0; towerIdx < towerStateObjects.length; towerIdx++) {
                    found = (this.children[towerSpriteIdx].name == towerStateObjects[towerIdx].name)
                    if (found) break;
                }
                if (!found) {  // Tower has been removed on server, remove it from the client view
                    this.removeChildAt(towerSpriteIdx)
                }
            }
        }

        // Update state of towers present in server update
        towerStateObjects.forEach((tower) => {
            let towerToUpdate = this.getChildByName(tower.name)
            towerToUpdate.setRotation(tower.angle)
            towerToUpdate.level = tower.level
            towerToUpdate.aim = tower.aim

            if (tower.hasShot) {
                towerToUpdate.shoot()
            }

            // Update the tower statsistics, but only store stats for towers a playerID owns
            if (tower.playerID == this.thisPlayer) {
                towerToUpdate.update(tower.stats)
            }
        })
    }

    setEventListeners() {
        this.on("clickDeployedTower", (tower) => {
            let pos = this.getChildIndex(tower)
            if (pos > 0) {
                // When a tower is clicked on we want it to render above the other towers
                // This is that the range sprite does not obfiscate them
                let endIdx = this.children.length - 1
                let tmp = this.getChildAt(pos)
                this.children[pos] = this.children[endIdx]
                this.children[endIdx] = tmp
            }
        })
    }

    startInteraction() {
        this._setContainerInteraction(this, true)
    }

    stopInteraction() {
        this._setContainerInteraction(this, false)
    }

    disableTowers() {
        this.children.forEach((tower) => {
            tower.interactiveChildren = false
        })
    }

    enableTowers() {
        this.children.forEach((tower) => {
            tower.interactiveChildren = true
        })
    }

    enableTowerByName(name) {
        this.getChildByName(name).interactiveChildren = true
    }

    tick() {
        super.tick()
        this.children.forEach((tower) => { tower.tick() })
    }
}