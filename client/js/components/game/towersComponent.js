import { getUserID } from "../../state.js"
import { BaseComponent } from "./base/baseComponent.js"
import { TowerInfoComponent } from "./towerInfoComponent.js"
import { RockThrowerTower } from "./towers/rockThrower.js"
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

    getTowerSprite(name, type) {
        let sprite
        switch(type) {
            case "rock-thrower":
                sprite = new RockThrowerTower(name, this.towerJson)
                break
            case "shrapnel-burst":
                sprite = new ShrapnelBurstTower(name, this.towerJson)
                break
        }
        return sprite
    }

    addPlacedTower(type, name, playerID, row, col) {
        let sprite = this.getTowerSprite(name, type)
        sprite.playerID = playerID

        sprite.gridX = col
        sprite.gridY = row
        sprite.x = sprite.gridX * this.mapSpriteSize + this.mapSpriteSize / 2;
        sprite.y = sprite.gridY * this.mapSpriteSize + this.mapSpriteSize / 2;

        if (playerID == getUserID()) { // Only make the tower interactive if the user placed it
            sprite.interactive = true; // reponds to mouse and touch events
            sprite.buttonMode = true; // hand cursor appears when hover over
            sprite.setInfoPopup(new TowerInfoComponent(sprite.name))
            sprite.hideInfoContainer()
            sprite
                .on('click', ()=> {
                    if (this.sprite_handler.getActiveClickable() == sprite) { // Clicked on the currently active tower
                        sprite.emit("clickoff")
                    } else { // Clicked on tower that is not active
                        if (this.sprite_handler.isActiveClickableSet()) this.sprite_handler.getActiveClickable().emit('clickoff') // Cancel current active clickable
                        this.sprite_handler.setActiveClickable(sprite) // Register this as the active object
                        sprite.showRangeCircle()
                        sprite.showInfoContainer()
                    }
                })
                .on('clickoff', ()=>{  // This is a custom event triggered manually
                    sprite.hideRangeCircle()
                    sprite.hideInfoContainer()
                    this.sprite_handler.unsetActiveClickable()
                });

            // Sprite stats (custom properties)
            sprite.kills = 0
        }
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