const fs = require('fs');
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
        this.row = row
        this.col = col
        this.angle = 0 // Angle in radians, 0 is East, goes clockwise
        this.rateOfFire = 10 // ticks between bullets
        this.fireTick = 0 // Ticks since last bullet
        this.range = towerJson[type]["gameData"]["range"]
        this.owner = player // The player who owns the tower
        this.kills = 0
        this.type = type
        this.shootRangePath = [] // Main grid squares that the bullets can reach that are on the path
        this.aimBehaviour // Furthest enemy, first enemy, etc.
    }

    /**
     * Calculates the squares in the map that if an enemy is present the bullet can hit
     * @param {Number[][]} path Main path (in [row, col] coordinates)
     */
    calculateShootPath(path) {
        for (let p=0; p < path.length; p++) {
            if (Math.sqrt(Math.pow((path[p][0] - this.row), 2) + Math.pow((path[p][1] - this.col), 2)) < this.range) {
                this.shootRangePath.push(path[p])
            }
        }
        console.log(this.shootRangePath)
    }
}

module.exports = {
    Tower: Tower
}