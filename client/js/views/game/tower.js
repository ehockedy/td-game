import { onDragTower, onPlaceTowerConfirm, onTowerClick, onTowerUnclick } from "./callbacks.js"
import { DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y } from "../constants.js"
import { randomHexString } from "../../tools.js"
import { getUsername } from "../../state.js"

// TODO this should eventually be moved into the constructor.
// It is here for now because the async load is not quick enough if placed in the constructor. Need to
// find a way around that
let towerJson
$.getJSON("shared/json/towers.json", function (data) {
    towerJson = data
})

/**
 * Class to store all state for towers in the game
 * All towers are stored in here
 */
export class TowerManager {
    constructor() {
        this.towerContainer = new PIXI.Container();
        this.towerDataContainer = new PIXI.Container();

        // Unique colour code for the user TODO let them pick and store for each user
        this.randomColourCode = "0x" + randomHexString(6);
    }

    getTowerCount() {
        return this.towerContainer.children.length
    }

    getTowerContainer() {
        return this.towerContainer
    }

    getTowerDataContainer() {
        return this.towerDataContainer
    }

    getTowerSprite(type) { // Make this a get sprite only function
        let texture = PIXI.Loader.shared.resources["client/img/tower_spritesheet.png"].texture
        let towerTexture = [new PIXI.Texture(texture, new PIXI.Rectangle(0, DEFAULT_SPRITE_SIZE_Y * towerJson[type]["spriteSheetNum"], DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y))]
        let towerSprite = new PIXI.AnimatedSprite(towerTexture)
        towerSprite.tint = this.randomColourCode
        towerSprite.loop = false
        towerSprite.anchor.set(0.5)
        return towerSprite
    }

    getTowerRangeGraphic(type) {
        let graphics = new PIXI.Graphics();
        graphics.beginFill("0xe74c3c") // Red
        graphics.alpha = 0.5
        graphics.drawCircle(0, 0, towerJson[type]["gameData"]["seekRange"] * DEFAULT_SPRITE_SIZE_Y) // position 0, 0 of the graphics canvas
        return graphics
    }

    addDraggableTower(type, x, y) {
        let sprite = this.getTowerSprite(type)
        sprite.interactive = true
        sprite.buttonMode = true
        sprite.name = randomHexString(6)
        sprite.dragging = false
        sprite.type = type
        sprite.owner = getUsername()
        sprite.x = x
        sprite.y = y

        // Attach a range sprite
        sprite.range_subsprite = this.getTowerRangeGraphic(type)
        sprite.range_subsprite.visible = false

        sprite
            .on("pointerdown", () => {
                sprite.dragging = true
            })
            .on("pointermove", onDragTower)
            .on("pointerup", onPlaceTowerConfirm)
            .on("pointerupoutside", onPlaceTowerConfirm)

        sprite.setParent(this.towerContainer)
        sprite.range_subsprite.setParent(this.towerDataContainer)
    }

    addPlacedTower(type, name, owner, row, col) {
        let sprite = this.getTowerSprite(type)
        sprite.name = name
        sprite.owner = owner

        sprite.gridX = col
        sprite.gridY = row
        sprite.x = sprite.gridX * DEFAULT_SPRITE_SIZE_X + DEFAULT_SPRITE_SIZE_X / 2;
        sprite.y = sprite.gridY * DEFAULT_SPRITE_SIZE_Y + DEFAULT_SPRITE_SIZE_Y / 2;

        if (owner == getUsername()) { // Only make the tower interactive if the user placed it
            sprite.interactive = true; // reponds to mouse and touch events
            sprite.buttonMode = true; // hand cursor appears when hover over
            sprite
                .on('click', onTowerClick)
                .on('clickoff', onTowerUnclick); // This is a custom event triggered manually

            sprite.range_subsprite = this.getTowerRangeGraphic(type)
            sprite.range_subsprite.x = sprite.x
            sprite.range_subsprite.y = sprite.y
            sprite.range_subsprite.visible = false
        }

        sprite.setParent(this.towerContainer)
        sprite.range_subsprite.setParent(this.towerDataContainer)
    }

    updateTower(name, angle) {
        let towerToUpdate = this.towerContainer.getChildByName(name)
        towerToUpdate.rotation = angle
        towerToUpdate.tint = this.randomColourCode // TODO store all player colours once
    }
}
