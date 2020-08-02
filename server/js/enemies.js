class Enemy {
    /**
     * 
     * @param {int} hp Damage it can take until dead
     * @param {int} speed Number of ticks it takes to move through a grid square
     * @param {int} y Row that the enemy begins in 
     */
    constructor(hp, speed, y) {
        this.hp = hp;
        this.speed = speed;
        this.y = y
        this.x = 0 // Starts in first column
    }

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