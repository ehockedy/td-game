const config = require('./constants.js')
const crypto = require('crypto');

class Bullet {
    constructor(towerPos, enemyPathPos, damage, speed, range, towerOwner) {
        this.x = towerPos[1]*config.SUBGRID_SIZE + towerPos[3]
        this.y = towerPos[0]*config.SUBGRID_SIZE + towerPos[2]
        this.startX = this.x
        this.startY = this.y
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
        this.distToTarget = Math.sqrt(Math.pow(xDelta,2) + Math.pow(yDelta,2))
        let multiplier = this.speed / this.distToTarget

        this.xSpeed = multiplier * xDelta
        this.ySpeed = multiplier * yDelta
        this.angleFromTower = Math.atan2(yDelta, xDelta)
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
        return this.willCollideWith(y, x, r, this.y, this.x)
    }

    willCollideWith(y, x, r, yFuture, xFuture) {
        // Check if the bullet collides with an object at position x, y with a hit box of a circle radius r
        let granularity = 4 // Go down the fire path in 4 increments
        for (let g = 0; g < granularity; g++) {
            if (Math.sqrt(Math.pow((x - (this.xSpeed*g/granularity) - xFuture),2) + Math.pow(y - (this.ySpeed*g/granularity) - yFuture,2)) < r) {
                return true;
            }
        }
        return false
    }

    updateTargetEnemyPos(enemyPathPos) {
        let enemyX = enemyPathPos[1]*config.SUBGRID_SIZE + enemyPathPos[3]
        let enemyY = enemyPathPos[0]*config.SUBGRID_SIZE + enemyPathPos[2]
        let xDelta = (enemyX - this.startX)
        let yDelta = (enemyY - this.startY)
        let multiplier = this.speed / Math.sqrt(Math.pow(xDelta,2) + Math.pow(yDelta,2))

        this.xSpeed = multiplier * xDelta
        this.ySpeed = multiplier * yDelta
    }

    positionInNTicks(n) {
        let x = this.startX + this.xSpeed*n
        let y = this.startY + this.ySpeed*n

        // Convert into grid & subgrid coordinates
        return [
            Math.floor(y / config.SUBGRID_SIZE),
            Math.floor(x / config.SUBGRID_SIZE),
            Math.floor(y % config.SUBGRID_SIZE),
            Math.floor(x % config.SUBGRID_SIZE),
        ]
    }

    // Rotate from bullet origin where it will head 
    rotateTarget(angle) {
        // use parametric coordinates equations
        let xDelta = this.distToTarget * Math.cos(this.angleFromTower+angle)
        let yDelta = this.distToTarget * Math.sin(this.angleFromTower+angle)
        let multiplier = this.speed / Math.sqrt(Math.pow(xDelta,2) + Math.pow(yDelta,2))
        this.xSpeed = multiplier * xDelta
        this.ySpeed = multiplier * yDelta
    }
}

module.exports = {
    Bullet: Bullet
}