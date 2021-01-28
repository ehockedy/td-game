const crypto = require('crypto');
const fs = require('fs');

let enemyConfig = JSON.parse(fs.readFileSync('shared/json/enemies.json'));

class Enemy {
    /**
     * 
     * @param {String} type The type of enemy to create
     * @param {Object} path Array of coordinates that tht enemy will follow
     * @param {Object} subgridSize Size of the subgrid of the map
     */
    constructor(type, path, subgridSize) {
        this.hp = enemyConfig[type].hp;
        this.speed = enemyConfig[type].speed;
        this.steps = 0  // How many steps taken through the map path
        this.name = crypto.randomBytes(20).toString('hex');
        this.hitboxRadius = subgridSize/3
        this.nearCentreRadius = this.subgridSize / 10  // Distance from centre point that is considered near. Used to determine when to turn
        this.rotation = 0  // angle in radians that enemy is facing, starting at 0 which is right/east

        this.path = path // Reference to the object in map
        this.subgridSize = subgridSize
        this.position = path[this.steps]
        this.row = this.position.row
        this.col = this.position.col
        this.subrow = this.position.subrow
        this.subcol = this.position.subcol
        this.x = this.position.x
        this.y = this.position.y

        // Update specific variables
        this.isHit = false  // Whether the enemy has been hit in that specific update
    }

    step() {
        this.steps += this.speed
        if (this.steps < this.path.length) {
            this.position = this.path[this.steps]

            this.row = this.position.row
            this.col = this.position.col
            this.subrow = this.position.subrow
            this.subcol = this.position.subcol

            this.x = this.position.x
            this.y = this.position.y
        }
    }

    // Given the type of tile the enemy is on determine if it needs to rotate itself to be facing a certain direction
    // tile type is in format '<direction>' or '<direction><direction>' if corner.
    // <direction> can be u, d, l, or r.
    // First direction is the direction of travel through the firt half of the square, second direction is direction through the second half od the square
    turn(tileType) {
        if (tileType.length != 2) return // No need to rotate if a straight path

        // If is near the centre of the circle, then start to rotate
        if (Math.abs(this.subrow - this.subgridSize/2) < this.nearCentreRadius &&
            Math.abs(this.subcol - this.subgridSize/2) < this.nearCentreRadius) {
            // Determine angle to face based on path tile type
            switch(tileType[1]) {
                case 'r':
                    this.rotation = 0
                    break
                case 'd':
                    this.rotation = Math.PI/2
                    break
                case 'l':
                    this.rotation = Math.PI
                    break
                case 'u':
                    this.rotation = -Math.PI/2
                    break
            }
        }
    }

    positionInNSteps(n) {
        let futureStep = this.steps + (this.speed * n)
        if (futureStep >= this.path.length) return this.path[this.path.length - 1]
        return this.path[futureStep]
    }

}

module.exports = {
    Enemy: Enemy
}
