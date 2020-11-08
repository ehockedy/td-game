const crypto = require('crypto');
const point = require('../js/point.js')
const config = require('./constants.js')

class Bullet {
    constructor(position, angle, damage, speed, range) {
        this.x = position.x
        this.y = position.y

        // Have to create new objects so that original object (tower position) is not changed when bullet position is updated during move
        this.position = new point.Point(this.x, this.y)
        this.bulletPosStart = new point.Point(this.x, this.y) // TODO replace this with cumulative dist travelled
        this.positionPrev = this.position

        this.speed = speed
        this.damage = damage
        this.range = range * config.SUBGRID_SIZE // Convert to global (since range is configured by number of squares)
        this.name = crypto.randomBytes(20).toString('hex');

        this.angle = angle
        this.xSpeed = this.speed * Math.cos(this.angle)
        this.ySpeed = this.speed * Math.sin(this.angle)

        this.hasMovedSquare = false
    }

    move() {
        this.positionPrev = new point.Point(this.x, this.y)

        this.x += this.xSpeed
        this.y += this.ySpeed

        // Convert into grid & subgrid coordinates
        this.position.updatePosGlobal(this.x, this.y)
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

    positionInNTicks(n) {
        let x = this.bulletPosStart.x + this.xSpeed*n
        let y = this.bulletPosStart.y + this.ySpeed*n
        return new point.Point(x, y)
    }

    isOutOfRange() {
        return Math.sqrt(
                Math.pow(this.position.x - this.bulletPosStart.x, 2) +
                Math.pow(this.position.y - this.bulletPosStart.y, 2)
            ) > this.range
    }

    isOffMap() {
        return (this.x < 0 || this.y < 0 || this.x > config.SUBGRID_SIZE*config.MAP_WIDTH || this.y > config.SUBGRID_SIZE*config.MAP_HEIGHT)
    }

    setOriginTower(originTower) {
        this.originTower = originTower // Reference to the tower that shot the bullet
    }
}

module.exports = {
    Bullet: Bullet
}