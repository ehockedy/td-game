class Enemy {
    /**
     * 
     * @param {int} hp Damage it can take until dead
     * @param {int} speed Number of ticks it takes to move through a grid square
     */
    constructor(hp, speed) {
        this.hp = hp;
        this.speed = speed;
        this.steps = 0  // How many steps taken through the map path
        this.name = "abcde" // TODO make this random hash
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