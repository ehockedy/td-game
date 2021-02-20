import { getUserID } from "../../state.js"
import { BaseComponent } from "./base/baseComponent.js"
import { TowerInfoComponent } from "./towerInfoComponent.js"
import { RockThrowerDraggableTower, RockThrowerNonInteractiveTower, RockThrowerDeployedTower } from "./towers/rockThrower.js"
import { ShrapnelBurstTower } from "./towers/shrapnelBurst.js"
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

        this.setupInteraction()
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

    setupInteraction() {
        this.on("clickDeployedTower", (tower) => {
            tower.toggleInfoContainer()
        })
    }

    getDraggableTowerSprite(name, type, originX, originY) {
        let sprite
        switch(type) {
            case "rock-thrower":
                sprite = new RockThrowerDraggableTower(name, this.towerJson, originX, originY)
                break
            case "shrapnel-burst":
                sprite = new ShrapnelBurstTower(name, this.towerJson)
                break
        }
        return sprite
    }

    getStaticTowerSprite(name, type) {
        let sprite
        switch(type) {
            case "rock-thrower":
                sprite = new RockThrowerNonInteractiveTower(name, this.towerJson)
                break
            case "shrapnel-burst":
                sprite = new ShrapnelBurstTower(name, this.towerJson)
                break
        }
        return sprite
    }

    getDeployedTowerSprite(name, type, playerID, x, y) {
        let sprite
        switch(type) {
            case "rock-thrower":
                sprite = new RockThrowerDeployedTower(name, this.towerJson, playerID, x, y)
                break
            case "shrapnel-burst":
                sprite = new ShrapnelBurstTower(name, this.towerJson)
                break
        }
        return sprite
    }


    addPlacedTower(type, name, playerID, row, col) {
        let x = col * this.mapSpriteSize + this.mapSpriteSize / 2;
        let y = row * this.mapSpriteSize + this.mapSpriteSize / 2;
        if (playerID == getUserID()) {
            let sprite = this.getDeployedTowerSprite(name, type, playerID, x, y)
            sprite.subscribe(this)
            this.addChild(sprite)
        } else {
            let sprite = this.getStaticTowerSprite(name, type)
            sprite.x = x
            sprite.y = y
            this.addChild(sprite)
        }
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
            // console.log(tower)
            let towerToUpdate = this.getChildByName(tower.name)
            towerToUpdate.rotation = tower.angle

            if (tower.hasShot) {
                towerToUpdate.onShoot()
            }

            // Update the tower statsistics, but only store stats for towers a playerID owns
            if (tower.playerID == getUserID()) {
                towerToUpdate.update(tower.stats)
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