import { DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y, MAP_WIDTH, MAP_HEIGHT, APP_HEIGHT, APP_WIDTH} from "../constants.js"
import { getBoard } from "../../state.js"
import { sendMessage, getTowerUpdateMsg, MSG_TYPES } from "../../networking.js"

// The element currently clicked/active
let activeClickable

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Events
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export function onDragTower(event) {
    if (!this.dragging) return

    const newPosition = event.data.getLocalPosition(this.parent);
    if (newPosition.x >= 0 && newPosition.y >= 0 && newPosition.x < MAP_WIDTH && newPosition.y < MAP_HEIGHT) {
        // If on map, snap to grid
        let newGridX = Math.floor(newPosition.x / DEFAULT_SPRITE_SIZE_X)
        let newGridY = Math.floor(newPosition.y / DEFAULT_SPRITE_SIZE_Y)
        if ((newGridX != this.gridX || newGridY != this.gridY) && // Been some change
            getBoard()[newGridY][newGridX]["value"] == 0) { // Must be empty space
            this.gridX = newGridX
            this.gridY = newGridY
            this.x = this.gridX * DEFAULT_SPRITE_SIZE_X + DEFAULT_SPRITE_SIZE_X / 2;
            this.y = this.gridY * DEFAULT_SPRITE_SIZE_Y + DEFAULT_SPRITE_SIZE_Y / 2;
        }
    } else if (newPosition.x >= 0 && newPosition.y >= 0 && newPosition.x < APP_WIDTH && newPosition.y < APP_HEIGHT) {
        // Otherwise, update position normally
        this.x = newPosition.x
        this.y = newPosition.y
    }

    // Also move range indicator to be same position as tower
    this.range_subsprite.x = this.x
    this.range_subsprite.y = this.y
}

function onPlaceTower() {
    if (isPointWithinContainer(this.x, this.y, mapContainer)) {
        sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD, getTowerUpdateMsg(this))
    }
}

export function onPlaceTowerConfirm() {
    if (this.x >= 0 && this.y >= 0 && this.x < MAP_WIDTH && this.y < MAP_HEIGHT) {
        this.dragging = false
        this.removeAllListeners()
        sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD_CONFIRM, getTowerUpdateMsg(this))
    } // else {
    this.parent.removeChild(this.range_subsprite)
    this.parent.removeChild(this) // TODO do we also need to rmove this sprite i.e. destroy()?
    //}
    // if (isPointWithinContainer(this.x, this.y, mapContainer)) {
    //     let name = randomHexString(20)
    //     addTower(name, this.type, username, this.gridY, this.gridX)
    //     sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD_CONFIRM, getTowerUpdateMsg(towerContainer.getChildByName(name)))
    // }
}

export function onTowerClick(event) {
    if (activeClickable == this) { // Clicked on the currently active tower
        this.emit("clickoff")
    } else { // Clicked on tower that is not active
        if (typeof activeClickable != "undefined") activeClickable.emit('clickoff') // Cancel current active clickable
        activeClickable = this // Register this as the active object
        this.range_subsprite.visible = true // Show the range circle
        //writeTowerInfo(this.type)
        //towerToolbarContentContainer.visible = true // Show info about the tower
    }
}

function onMenuTowerClick(event) {
    if (activeClickable == this) { // Clicked on the currently active tower
        this.emit('clickoff');
    } else { // Clicked on tower that is not active
        if (typeof activeClickable != "undefined") activeClickable.emit('clickoff') // Cancel current active clickable
        activeClickable = this // Register this as the active object
        writeTowerInfo(this.type)
    }
}

export function onTowerUnclick() {
    this.range_subsprite.visible = false
    //towerToolbarContentContainer.removeChildren()
    activeClickable = undefined
}

function onMenuTowerUnclick() {
    towerToolbarContentContainer.removeChildren()
    activeClickable = undefined
}

export function onCanvasClick(event) {
    if (typeof activeClickable != "undefined") {
        if (!activeClickable.containsPoint(new PIXI.Point(event.layerX, event.layerY))) {
            activeClickable.emit('clickoff'); // clickoff event is agnostic to the type of object stored in activeClickable
        }
    }
}

export {}