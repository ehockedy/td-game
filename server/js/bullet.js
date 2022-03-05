const crypto = require('crypto');
const fs = require('fs');

let bulletConfig = JSON.parse(fs.readFileSync('shared/json/bullets.json'));

class Bullet {
    constructor(position, angle, damage, speedSquaresPerSecond, range, type) {
        this.position = position.getCopy()
        this.bulletPosStart = position.getCopy()  // TODO replace this with cumulative dist travelled
        this.positionPrev = position.getCopy()

        this.speed = speedSquaresPerSecond
        this.damage = damage
        this.range = range
        this.type = type
        this.piercingCount = bulletConfig[this.type].piercingCount
        this.name = crypto.randomBytes(20).toString('hex');

        this.angle = angle
        this.xSpeed = this.speed * Math.cos(this.angle)
        this.ySpeed = this.speed * Math.sin(this.angle)

        this.hasMovedSquare = false
    }

    move() {
        this.positionPrev = this.position.getCopy()

        // Convert into grid & subgrid coordinates
        this.position.updatePosGlobal(this.position.x + this.xSpeed, this.position.y + this.ySpeed)
        this.hasMovedSquare = (this.position.row != this.positionPrev.row || this.position.col != this.positionPrev.col)
    }

    updateAngleAndSpeeds(newAngle) {
        this.angle = newAngle
        this.xSpeed = this.speed * Math.cos(newAngle)
        this.ySpeed = this.speed * Math.sin(newAngle)
    }

    collidesWith(pos, r) {
        return this.willCollideWith(pos, this.position, r)
    }

    willCollideWith(pos, futurePos, r) {
        // Check if the bullet collides with an object at position x, y with a hit box of a circle radius r
        let granularity = 4 // Go down the fire path in 4 increments
        for (let g = 0; g < granularity; g++) {
            if (Math.sqrt(Math.pow((pos.x - (this.xSpeed*g/granularity) - futurePos.x),2) + Math.pow(pos.y - (this.ySpeed*g/granularity) - futurePos.y,2)) < r) {
                return true;
            }
        }
        return false
    }


    collide() {
        this.piercingCount -= 1
        return this.piercingCount <= 0
    }

    positionInNTicks(n) {
        let tempPos = this.bulletPosStart.getCopy()
        tempPos.x += this.xSpeed*n
        tempPos.y += this.ySpeed*n
        return tempPos
    }

    isOutOfGivenRange(range) {
        return Math.sqrt(
            Math.pow(this.position.x - this.bulletPosStart.x, 2) +
            Math.pow(this.position.y - this.bulletPosStart.y, 2)
        ) > range
    }

    isWithinGivenRange(range) {
        return Math.sqrt(
            Math.pow(this.position.x - this.bulletPosStart.x, 2) +
            Math.pow(this.position.y - this.bulletPosStart.y, 2)
        ) < range
    }

    isOffMap(mapWidth, mapHeight, subgridSize) {
        return (this.position.x < 0 || this.position.y < 0 || this.position.x >= subgridSize*mapWidth || this.position.y >= subgridSize*mapHeight)
    }

    setOriginTower(originTower) {
        this.originTower = originTower // Reference to the tower that shot the bullet
    }

    getPlayer() {
        if (!this.originTower) return ""
        return this.originTower.player
    }
}

module.exports = {
    Bullet: Bullet
}