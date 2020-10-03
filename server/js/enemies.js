const crypto = require('crypto');
const tools = require('./tools.js')

class Enemy {
    /**
     * 
     * @param {Number} hp Damage it can take until dead
     * @param {Number} speed Number of ticks it takes to move through a grid square
     * @param {Object} path Array of coordinates that tht enemy will follow
     */
    constructor(hp, speed, path) {
        this.hp = hp;
        this.speed = speed;
        this.steps = 0  // How many steps taken through the map path
        this.name = crypto.randomBytes(20).toString('hex');

        this.path = path // Reference to the object in map
        this.position = path[this.steps]
        this.row = this.position.row
        this.col = this.position.col
        this.subrow = this.position.subrow
        this.subcol = this.position.subcol
        this.x = this.position.x
        this.y = this.position.y

        // Update specific variables
        this.isHit = false // Whether the enemy has been hit in that specific update
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

    positionInNSteps(n) {
        let futureStep = this.steps + (this.speed * n)
        if (futureStep >= this.path.length) return this.path[this.path.length - 1]
        return this.path[futureStep]
    }

}

module.exports = {
    Enemy: Enemy
}
