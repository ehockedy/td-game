const config = require('./constants.js')
const crypto = require('crypto');

class Bullet {
    constructor(towerPos, enemyPathPos, damage, speed, range, towerOwner) {
        this.x = towerPos[1]*config.SUBGRID_SIZE + towerPos[3]
        this.y = towerPos[0]*config.SUBGRID_SIZE + towerPos[2]
        this.bulletPos = towerPos
        this.bulletPosStart = towerPos
        this.speed = speed
        this.damage = damage
        this.range = range
        this.tower = towerOwner
        this.name = crypto.randomBytes(20).toString('hex');

        let enemyX = enemyPathPos[1]*config.SUBGRID_SIZE + enemyPathPos[3]
        let enemyY = enemyPathPos[0]*config.SUBGRID_SIZE + enemyPathPos[2]
        let xDelta = (enemyX - this.x)
        let yDelta = (enemyY - this.y)
        let multiplier = this.speed / Math.sqrt(Math.pow(xDelta,2) + Math.pow(yDelta,2))

        this.xSpeed = multiplier * xDelta
        this.ySpeed = multiplier * yDelta
    }

    move() {
        this.x += this.xSpeed
        this.y += this.ySpeed

        // Convert into grid & subgrid coordinates
        this.bulletPos = [
            Math.floor(this.y / config.SUBGRID_SIZE),
            Math.floor(this.x / config.SUBGRID_SIZE),
            Math.floor(this.y % config.SUBGRID_SIZE),
            Math.floor(this.x % config.SUBGRID_SIZE),
        ]
    }


    collidesWith(y, x, r) {
        // Check if the bullet collides with an object at position x, y with a hit box of a circle radius r
        let granularity = 4 // Go down the ire path in 4 increments
        for (let g = 0; g < granularity; g++) {
            if (Math.sqrt(Math.pow((x - (this.xSpeed*g/granularity) - this.x),2) + Math.pow(y - (this.ySpeed*g/granularity) - this.y,2)) < r) {
                return true;
            }
        }
        return false
    }
}

module.exports = {
    Bullet: Bullet
}