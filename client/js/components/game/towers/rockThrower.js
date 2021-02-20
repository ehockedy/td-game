import { BaseNonInteractiveTower } from "./baseNonInteractiveTower.js"
import { BaseDraggableTower } from "./baseDraggableTower.js"
import { BaseDeployedTower } from "./baseDeployedTower.js"

export class RockThrowerNonInteractiveTower extends BaseNonInteractiveTower {
    constructor(name, towerConfig) {
        super("rock-thrower", name, towerConfig)
    }
}

export class RockThrowerDraggableTower extends BaseDraggableTower {
    constructor(name, towerConfig, originX, originY) {
        super("rock-thrower", name, towerConfig, originX, originY)
    }
}

export class RockThrowerDeployedTower extends BaseDeployedTower {
    constructor(name, towerConfig, playerID, x, y) {
        super("rock-thrower", name, towerConfig, playerID, x, y)
    }
}