const fs = require('fs');
const tools = require('./tools.js')
const config = require('./constants.js')
const bullet = require("./bullet.js");

let towerJson = JSON.parse(fs.readFileSync('shared/json/towers.json'));

class Tower {
    /**
     * A player owned object that shoots at enemies
     * @param {String} type Unique name of tower assigned by client
     * @param {Number} type Type of tower
     * @param {String} player Who the tower belongs to
     * @param {Number} row Main grid row
     * @param {Number} col Main grid column
     */
    constructor(name, type, player, row, col) {
        this.name = name;
        this.type = type

        this.row = row
        this.col = col
        let coords = tools.localToGlobal([row, col, config.SUBGRID_SIZE/2, config.SUBGRID_SIZE/2])
        this.x = coords[0]
        this.y = coords[1]

        this.angle = 0 // Angle in radians, 0 is East, goes clockwise
        this.rateOfFire = towerJson[type]["gameData"]["rateOfFire"] // ticks between bullets
        this.fireTick = 0 // Ticks since last bullet
        this.range = towerJson[type]["gameData"]["seekRange"]
        this.shootRange = towerJson[type]["gameData"]["shootRange"] // How far bullet cant travel once fired
        this.bulletSpeed = towerJson[type]["gameData"]["bulletSpeed"]
        this.damage = towerJson[type]["gameData"]["damage"]
        this.owner = player // The player who owns the tower
        this.kills = 0
        this.shootRangePath = [] // Main grid squares that the bullets can reach that are on the path
        this.aimBehaviour = "last" // Furthest enemy, first enemy, etc.
        this.turns = towerJson[type]["gameData"]["turns"] // Whether it turns to face an enemy or not
        this.target
    }

    /**
     * Calculates the squares in the map that if an enemy is present the bullet can hit
     * @param {Number[][]} path Main path (in [row, col] coordinates)
     */
    calculateShootPath(path) {
        for (let p=0; p < path.length; p++) {
            if (Math.sqrt(Math.pow((path[p][0] - this.row), 2) + Math.pow((path[p][1] - this.col), 2)) <= this.range) {
                this.shootRangePath.push(path[p])
            }
        }
    }

    setTarget(enemy) {
        this.target = enemy
    }

    shoot() { // TODO change name, since won't always shoot?
        let newBullet
        let isHit = false
        if (this.fireTick == 0) {
            let ticks = 1
            newBullet = new bullet.Bullet(
                this.x,
                this.y,
                this.angle,
                this.damage,
                this.bulletSpeed,
                this.shootRange
                )

            // Iterate through enemies future positions to find one that bullet will hit
            while (this.target.steps + ticks*this.target.speed < this.target.path.length && !isHit) {
                let nextCoord = tools.localToGlobal(this.target.positionInNSteps(ticks)) // Where the enemy will be
                let nextAngle = Math.atan2(nextCoord[1]-this.y, nextCoord[0]-this.x) // The angle of the tower to that position
                newBullet.updateAngleAndSpeeds(nextAngle)
                let bulletFuturePos = newBullet.positionInNTicks(ticks) // See where bullet will be, when travelling at that angle, when the enemy is in that position
                if (newBullet.willCollideWith(nextCoord, bulletFuturePos, Math.floor(config.SUBGRID_SIZE/2))){
                    isHit = true
                    if (this.turns) this.angle = nextAngle
                }
                ticks++
            }
        }

        this.fireTick = (this.fireTick + 1) % this.rateOfFire
        return isHit ? newBullet : null
    }
}

module.exports = {
    Tower: Tower
}