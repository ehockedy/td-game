import { onDragTower, onPlaceTowerConfirm } from "./callbacks.js"
import { DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y } from "../constants.js"
import { randomHexString } from "../../tools.js"
import { getUsername } from "../../state.js"


let towerJson2
$.getJSON("shared/json/towers.json", function (data) {
    towerJson2 = data
    console.log(data)
})
export function getTowerSprite(type) { // Make this a get sprite only function
    let texture = PIXI.Loader.shared.resources["client/img/tower_spritesheet.png"].texture
    let towerTexture = [new PIXI.Texture(texture, new PIXI.Rectangle(0, DEFAULT_SPRITE_SIZE_Y*towerJson2[type]["spriteSheetNum"], DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y))]
    let towerSprite = new PIXI.AnimatedSprite(towerTexture)
    towerSprite.loop = false
    towerSprite.anchor.set(0.5)
    towerSprite.tint = "0xAABB00"
    return towerSprite
}

export function getTowerRangeGraphic(type) {
    let graphics = new PIXI.Graphics();
    graphics.beginFill("0xe74c3c") // Red
    graphics.alpha = 0.5
    graphics.drawCircle(0, 0, towerJson2[type]["gameData"]["seekRange"]*DEFAULT_SPRITE_SIZE_Y) // position 0, 0 of the graphics canvas
    return graphics //circleSprite
}

export function getDraggableTower(type) { // TODO make this draggable tower and have another for clickable game tower
    let sprite = getTowerSprite(type)
    sprite.interactive = true
    sprite.buttonMode = true
    sprite.name = randomHexString(6)
    sprite.dragging = false
    sprite.type = type
    sprite.owner = getUsername()

    // Attach a range sprite
    sprite.range_subsprite = getTowerRangeGraphic(type)
    sprite.range_subsprite.visible = false

    sprite
        .on("pointerdown", () => {
            sprite.dragging = true
            sprite.range_subsprite.visible = true
        })
        .on("pointermove", onDragTower)
        .on("pointerup", onPlaceTowerConfirm)
        .on("pointerupoutside", onPlaceTowerConfirm)
    return sprite
}
