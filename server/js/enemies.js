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
        console.log(this.name)
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