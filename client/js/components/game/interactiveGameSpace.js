import { BaseComponent } from "./base/baseComponent.js"
import { DeployedTowerMainMenu } from "./ui/deployedTowerMenu.js"

/**
 * This class represents the main game area that has interactive components, such as towers and tower menu
 * By including them all together, it is easy to move relative other components, such as menus
 * This is good, since the enemies, map squares, bullets etc. are all relative to each other 
 * */
export class InteractiveGameSpace extends BaseComponent {
    // TODO I think this should accept more componenets in ctor, such as map, enemies.
    constructor(map, towerMenu, mapSpriteSize, interactionBoundaryX, interactionBoundaryY) {
        super("gameSpace")
        this.map = map
        this.towerMenu = towerMenu
        this.mapSpriteSize = mapSpriteSize
        this.interactionBoundaryX = interactionBoundaryX - 1
        this.interactionBoundaryY = interactionBoundaryY - 1

        this.addChild(this.map)
        this.addChild(this.towerMenu)

        this.deployedTowerMainMenu = new DeployedTowerMainMenu(this.towerMenu.x_menu, this.towerMenu.y_menu)
        this.addChild(this.deployedTowerMainMenu)
        this.deployedTowerMainMenu.hide()
    }

    // Assign all the actions that are triggered by interaction with the sub components
    setTowerInteraction() {
        // When the tower is being clicked and dragged, update the position of the tower
        // If the tower is within the tower menu area, move normally
        // If the tower is within the map area, snap to grid
        this.on("clickAndDragTower", (event, tower)=> {
            let pos = event.data.getLocalPosition(this)

            // Still want to move if mouse outside the boundary, so map the position to the most extreme point within the boundary
            if (pos.x < 0) pos.x = 0
            if (pos.x > this.interactionBoundaryX) pos.x = this.interactionBoundaryX
            if (pos.y < 0) pos.y = 0
            if (pos.y > this.interactionBoundaryY) pos.y = this.interactionBoundaryY

            // Map grid position
            let col = Math.floor(pos.x / this.mapSpriteSize)
            let row = Math.floor(pos.y / this.mapSpriteSize)

            // Check is within map
            let xInArea = pos.x >= 0 && pos.x < this.interactionBoundaryX
            let yInArea = pos.y >= 0 && pos.y < this.interactionBoundaryY
            if (xInArea || yInArea) {
                if (pos.y < this.mapSpriteSize*this.map.rows) {
                    // If in the map area, snap to grid, and don't move if over a path or occupied space
                    if (this.map.getGridValue(row, col) == 'x') {
                        if (xInArea) {
                            tower.setX(col * this.mapSpriteSize + this.mapSpriteSize / 2)
                            tower.setCol(col)
                        }
                        if (yInArea) {
                            tower.setY(row * this.mapSpriteSize + this.mapSpriteSize / 2)
                            tower.setRow(row)
                        }
                    }
                } else {
                    // Update positon normally if within the tower menu area
                    tower.setPosition(pos)
                }
                tower.showRangeCircle()
            }
        })

        // If pressed down on the tower
        this.on("pressDownTower", (tower)=>{
            tower.hidePlaceTowerButtons()
        })

        // If was dragging and let go of the tower
        // If over map, it stays where it is, else reset the position
        this.on("releaseTower", (tower)=>{
            tower.showPlaceTowerButtons()
            if (tower.y > this.towerMenu.height_px - this.towerMenu.height_menu_px) {
                tower.reset()
            }
        })

        this.on("clickDeployedTower", (tower) => {
            this.towerMenu.toggle()
            this.deployedTowerMainMenu.toggle()
            this.deployedTowerMainMenu.updateTowerInfo(tower)
            tower.toggleRangeCircle()
            this.activeTower = tower  // This is the tower currently being interacted with
        })
    }

    updateTowers(towers) {
        // Get updates from the server so info displayed on the tower menu can be up to date
        if (this.activeTower) {
            towers["objects"].forEach((tower) => {
                if (tower.name == this.activeTower.name) {
                    this.deployedTowerMainMenu.updateTowerInfo(tower)
                }
            })
        }
    }
}
