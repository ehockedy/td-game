import { getUserID } from "../../state.js"
import { BaseComponent } from "./base/baseComponent.js"
import { DeployedTower } from "./towers/deployedTower.js"
import { randomHexString } from "../../tools.js"

/**
 * This component stores all the information about the towers that are out on the map
 * In future, might be best to remove the sprite creation functions out
 */
// TODO make a central tower factory - the only one that loads towerJson, then have this as the "towers on the map component"
// Tower factory should holw - tower data, have the name/idx -> tower object switch, tower colour per player maybe?
export class TowersComponent extends BaseComponent {
    constructor(sprite_handler, mapSpriteSize){
        super()
        this.mapSpriteSize = mapSpriteSize
        this.sprite_handler = sprite_handler
        this.towerStateHashPrev = ""

        this.observers = [this]
        this.setEventListeners()
    }

    // Asynchronosly load the tower data
    loadData() {
        let _this = this
        return new Promise((resolve) => {
            fetch("shared/json/towers.json").then((response) => {
                response.json().then((data) => {
                    _this.towerJson = data
                    _this.towerJson["colour"] = "0x" + randomHexString(6)
                    resolve()
                })
            })
        })
    }

    subscribe(observer) {
        this.observers.push(observer)
    }

    addPlacedTower(type, name, playerID, row, col) {
        let sprite = new DeployedTower(type, name, this.towerJson, playerID)
        if (playerID == getUserID()) {
            this.observers.forEach((observer) => {sprite.subscribe(observer)})
        } else {
            sprite.disableInteractivity()
        }
        sprite.x = col * this.mapSpriteSize + this.mapSpriteSize / 2;
        sprite.y = row * this.mapSpriteSize + this.mapSpriteSize / 2;
        this.addChild(sprite)
    }

    update(towerData) {
        let towerStateObjects = towerData["objects"];
        let towerStateHash = towerData["hash"];

        if (towerStateHash != this.towerStateHashPrev) {
            this.towerStateHashPrev = towerStateHash

            // Identify tower not in container but in server update
            let nameIdx = 0
            for (nameIdx; nameIdx < towerStateObjects.length; nameIdx++) {
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
        }

        // Update state of towers present in server update
        towerStateObjects.forEach((tower) => {
            let towerToUpdate = this.getChildByName(tower.name)
            towerToUpdate.setRotation(tower.angle)
            towerToUpdate.level = tower.level

            if (tower.hasShot) {
                towerToUpdate.shoot()
            }

            // Update the tower statsistics, but only store stats for towers a playerID owns
            if (tower.playerID == getUserID()) {
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

    tick() {
        super.tick()
        this.children.forEach((tower) => { tower.tick() })
    }
}