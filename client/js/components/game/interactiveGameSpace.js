import { BaseComponent } from "./base/baseComponent.js"
import { DeployedTowerMenu } from "./ui/deployedTowerMenu.js"

/**
 * This class represents the main game area that has interactive components, such as towers and tower menu
 * By including them all together, it is easy to move relative other components, such as menus
 * This is good, since the enemies, map squares, bullets etc. are all relative to each other 
 * */
export class InteractiveGameSpace extends BaseComponent {
    constructor(map, towerMenu, towersComponent, enemiesComponent, bulletsComponent,
                mapSpriteSize, interactionBoundaryX, interactionBoundaryY) {
        super("gameSpace")
        this.map = map
        this.towerMenu = towerMenu
        this.towersComponent = towersComponent

        this.mapSpriteSize = mapSpriteSize
        this.interactionBoundaryX = interactionBoundaryX - 1
        this.interactionBoundaryY = interactionBoundaryY - 1

        // Add all the components that sit within this game area
        // Order placed here is order rendered back-to-front
        this.addChild(this.map)
        this.addChild(this.towersComponent)
        this.addChild(enemiesComponent)
        this.addChild(bulletsComponent)
        this.addChild(this.towerMenu)

        this.deployedTowerMainMenu = new DeployedTowerMenu(this.towerMenu.x_menu, this.towerMenu.y_menu)
        this.addChild(this.deployedTowerMainMenu)
        this.deployedTowerMainMenu.hide()
        this.deployedTowerMainMenu.subscribe(this)

        this.draggableTowerIsActive = false  // Whether a tower from the tower menu is being dragged around
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

            // Check is within map
            let xInArea = pos.x >= 0 && pos.x < this.interactionBoundaryX
            let yInArea = pos.y >= 0 && pos.y < this.interactionBoundaryY
            if (xInArea || yInArea) {
                if (pos.y < this.mapSpriteSize*this.map.rows) {
                    // If in the map area, snap to grid
                    // If over a path or occupied space, snap to the closest non-occupied space
                    let closestOccupiableSpace = this.map.getNearestNonOccupiedSquare(pos.x, pos.y)
                    let newRow = closestOccupiableSpace.row
                    let newCol = closestOccupiableSpace.col
                    if (xInArea) {
                        tower.setX(newCol * this.mapSpriteSize + this.mapSpriteSize / 2)
                        tower.setCol(newCol)
                    }
                    if (yInArea) {
                        tower.setY(newRow * this.mapSpriteSize + this.mapSpriteSize / 2)
                        tower.setRow(newRow)
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
            if (!this.draggableTowerIsActive) {
                // If a tower is being dragged around by the user, want no other tower to be interactable so disable them all
                this.towerMenu.disableTowers()
                this.towersComponent.disableTowers()
                this.towerMenu.enableTowerByName(tower.name)
                this.draggableTowerIsActive = true
            }
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
            if (this.activeTower) {
                this.activeTower.unsetActive()
            }
            this.towerMenu.hide()
            this.deployedTowerMainMenu.show()
            this.deployedTowerMainMenu.setSelectedTower(tower)
            tower.setActive()
            this.activeTower = tower  // This is the tower currently being interacted with
        })

        this.on("clickOffDeployedTower", (tower) => {
            this.towerMenu.show()
            this.deployedTowerMainMenu.hide()
            tower.unsetActive()
            this.activeTower = undefined
        })

        this.on("resetTower", (tower) => {
            this.draggableTowerIsActive = false
            // Release all componets
            this.towerMenu.enableTowers()
            this.towersComponent.enableTowers()
        })
    }

    subscribeToDeployedTowerMenu(observer) {
        this.deployedTowerMainMenu.subscribe(observer)
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
