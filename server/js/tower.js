const fs = require('fs');
const bullet = require("./bullet.js");

let towerJson = JSON.parse(fs.readFileSync('shared/json/towers.json'));

class Tower {
    /**
     * A player owned object that shoots at enemies
     * @param {String} type Unique name of tower assigned by client
     * @param {Number} type Type of tower
     * @param {String} player Who the tower belongs to
     * @param {Point} position Point object that described the position in global and grid/subgrid coordinates
     */
    constructor(name, type, player, position, subgridSize) {
        this.name = name;
        this.type = type

        this.position = position
        this.row = position.row
        this.col = position.col
        this.x = position.x
        this.y = position.y
        this.tickStepSize = subgridSize/60  // Number of steps to take to move through a square in 60 ticks

        this.fireTick = 0 // Ticks since last bullet
        this.target
        this.shootFunction = this._getShootBehaviour(towerJson[type]["shootPattern"])
        this.shootRangePath = [] // Main grid squares that the bullets can reach that are on the path
        this.angle = 0 // Angle in radians, 0 is East, goes clockwise
        this.turns = towerJson[type]["gameData"]["turns"] // Whether it turns to face an enemy or not
        this.player = player // The player who owns the tower
        this.cost = towerJson[type]["cost"]
        this.sellPrice = Math.floor(this.cost/2)  // Initial sell cost
        this.hasShot = false // Whether the tower has shot in this update round
        this.bulletType = towerJson[type]["bulletType"]
        this.level = 1

        // These values can change based on user actions
        this.state = {
            "rateOfFire" : towerJson[type]["gameData"]["rateOfFire"], // ticks between bullets
            "seekRange": towerJson[type]["gameData"]["seekRange"],
            "shootRange": towerJson[type]["gameData"]["shootRange"], // How far bullet can travel once fired
            "bulletSpeed": towerJson[type]["gameData"]["bulletSpeed"],
            "damage": towerJson[type]["gameData"]["damage"],
            "bulletCount": towerJson[type]["gameData"]["numberOfBullets"],
            "aimBehaviour": "first", // Which enemy to shoot at from all those in it's range
        }

        // Statistics about a tower that are sent to the client
        this.stats = {
            "kills": 0
        }

        // Load the upgrades config into a map so can keep track
        this.upgrades = {}
        console.log(type, towerJson[type])
        towerJson[type]["upgrades"].forEach((upgrade) => {
            this.upgrades[upgrade.type] = {
                "cost": upgrade.cost,
                "fn": this._typeToUpgradeFn(upgrade.type),
                "purchased": false
            }
        })
        this.purchased = []  // Quick access store for the purchased ones
    }

    /**
     * Calculates the squares in the map that if an enemy is present the bullet can hit
     * @param {Number[][]} path Main path (in [row, col] coordinates)
     */
    calculateShootPath(path) {
        for (let p=0; p < path.length; p++) {
            if (Math.sqrt(Math.pow((path[p].row - this.row), 2) + Math.pow((path[p].col - this.col), 2)) <= this.state.seekRange) {
                this.shootRangePath.push(path[p])
            }
        }
    }

    setTarget(enemy) {
        this.target = enemy
    }

    update(property, value) {
        if (property in this.state) {
            this.state[property] = value
            console.log(this.name, this.player.id, "Updating property", property, "to", value)
        } else {
            console.log(property, "is not a valid tower property")
        }
    }

    upgrade(type, availableMoney) {
        if (this.upgrades[type].purchased) return 0
        if (availableMoney < this.upgrades[type].cost) return 0
        this.upgrades[type].fn()
        this.level += 1
        this.upgrades[type].purchased = true
        this.purchased.push(type)
        return this.upgrades[type].cost
    }

    registerKill() {
        this.stats.kills += 1
    }

    getCost() {
        return this.cost
    }

    // rather than returning state of all upgrades, client view just wants to know which
    // have been bought
    getPurchasedUpgrades() {
        return this.purchased
    }

    /**
     * Returns an array of bullets that the tower has created
     * This gets called on every tick of the game loop, even though the tower does not always
     * shoot. It is called so that the tower can rotate to follow the enemy it is aiming at.
     */
    shoot() {
        let newBullets = this.shootFunction()
        if (this.fireTick == 0) {
            this.hasShot = true
        } else {
            newBullets = [] // Only return the bullets if actually shooting
            this.hasShot = false
        }
        return newBullets
    }

    tick() {
        if (this.target || (!this.target && this.fireTick > 0)) {
            this.fireTick = (this.fireTick + 1) % this.state.rateOfFire
        }
    }

    _getBullet(position, angle) {
        let newBullet = new bullet.Bullet(
            position,
            angle,
            this.state.damage,
            Math.floor(this.state.bulletSpeed * this.tickStepSize),
            this.state.shootRange,
            this.bulletType
        )
        newBullet.setOriginTower(this)
        return newBullet
    }

    // "Private" methods that make the tower shoot in different ways
    _getShootBehaviour(shootPattern) {
        let func;
        switch (shootPattern) {
          case "single":
            func = this._normalShot;
            break;
          case "burst":
            func = this._allDirShot;
            break;
          case "scatter":
            func = this._tripleShot;
            break;
          default:
            func = this._normalShot;
            break;
        }
        return func
    }

    // Produce a single bullet the moves towards the target
    _normalShot() {
        let ticks = 1
        let isHit = false
        let newBullet = this._getBullet(this.position, this.angle)

        // Iterate through enemies future positions to find one that bullet will hit
        while (this.target.steps + ticks*this.target.speed < this.target.path.length && !isHit) {
            let nextPos = this.target.positionInNSteps(ticks) // Where the enemy will be
            let nextAngle = Math.atan2(nextPos.y-this.y, nextPos.x-this.x) // The angle of the tower to that position
            newBullet.updateAngleAndSpeeds(nextAngle)
            let bulletFuturePos = newBullet.positionInNTicks(ticks) // See where bullet will be, when travelling at that angle, when the enemy is in that position
            if (newBullet.willCollideWith(nextPos, bulletFuturePos, this.target.hitboxRadius)){
                isHit = true
                if (this.turns) this.angle = nextAngle
            }
            ticks++
        }
        return [newBullet]
    }

    _tripleShot() {
        let mainBullet = this._normalShot()[0]
        let leftBullet = this._normalShot()[0] // TODO add a "make default bullet" private function to avoid this
        let rightBullet = this._normalShot()[0]

        let angleVariation = Math.PI/8
        leftBullet.updateAngleAndSpeeds(mainBullet.angle - angleVariation)
        rightBullet.updateAngleAndSpeeds(mainBullet.angle + angleVariation)

        return [leftBullet, mainBullet, rightBullet]
    }

    _allDirShot() {
        let bullets = []
        for (let a = 0; a < this.state.bulletCount; a++) {
            bullets.push(this._getBullet(this.position, (2*Math.PI/this.state.bulletCount)*a))
        }
        return bullets
    }

    _typeToUpgradeFn(type) {
        switch(type) {
            case "dmg-up":
                return () => {this._stateUpBy20("damage")}
            case "rof-up":
                return () => {this._stateDownBy20("rateOfFire")}
            case "range-up":
                return () => {
                    this._stateUpBy20("seekRange")
                    this._stateUpBy20("shootRange")
                }
            case "bullets-up":
                return () => {
                    this._stateUpBy20("bulletCount")
                }
            default:
                return () => {}
        }
    }

    _stateUpBy20(prop) {
        // Increases a given property by 20% (minimum of 1)
        this.state[prop] = Math.ceil(this.state[prop] * 1.2)
    }

    _stateDownBy20(prop) {
        // Decrease a given property by 20% (minimum of 1)
        this.state[prop] = Math.ceil(this.state[prop] * 0.8)
    }
}

module.exports = {
    Tower: Tower
}