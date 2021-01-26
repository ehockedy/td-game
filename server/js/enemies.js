const crypto = require('crypto');
const fs = require('fs');

let enemyConfig = JSON.parse(fs.readFileSync('shared/json/enemies.json'));

class Enemy {
    /**
     * 
     * @param {String} type The type of enemy to create
     * @param {Object} path Array of coordinates that tht enemy will follow
     * @param {Object} hitboxRadius Radius of hitbox circle
     */
    constructor(type, path, hitboxRadius) {
        this.hp = enemyConfig[type].hp;
        this.speed = enemyConfig[type].speed;
        this.steps = 0  // How many steps taken through the map path
        this.name = crypto.randomBytes(20).toString('hex');
        this.hitboxRadius = hitboxRadius

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
