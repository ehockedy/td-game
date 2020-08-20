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
        //console.log(this.x, this.y, this.xSpeed, this.ySpeed)
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
}

module.exports = {
    Bullet: Bullet
}