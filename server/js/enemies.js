const crypto = require('crypto');

class Enemy {
    /**
     * 
     * @param {Number} hp Damage it can take until dead
     * @param {Number} speed Number of ticks it takes to move through a grid square
     */
    constructor(hp, speed) {
        this.hp = hp;
        this.speed = speed;
        this.steps = 0  // How many steps taken through the map path
        this.name = crypto.randomBytes(20).toString('hex');
        this.row = 0
        this.col = 0

        // Update specific variables
        this.isHit = false // Whether the enemy ahs been hit in that specific update
    }

}

module.exports = {
    Enemy: Enemy
}

/**
 * 0 0 0
 * 0 0 0
 * 0 0 0
 * 
 * 0 0 0 0 0
 * 0 0 0 0 0
 * 0 0 0 0 0
 * 0 0 0 0 0
 * 0 0 0 0 0
 * 
 * 0 0 0 0
 * 0 0 0 0
 * 0 0 0 0
 * 0 0 0 0
 */