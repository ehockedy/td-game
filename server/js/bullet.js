const crypto = require('crypto');
const tools = require('./tools.js')

class Bullet {
    constructor(x, y, angle, damage, speed, range) {
        this.x = x
        this.y = y
        this.startX = this.x
        this.startY = this.y

        this.bulletPos = tools.globalToLocal([this.x, this.y])
        this.bulletPosStart = tools.globalToLocal([this.x, this.y])

        this.speed = speed
        this.damage = damage
        this.range = range
        this.name = crypto.randomBytes(20).toString('hex');

        this.angle = angle
        this.xSpeed = this.speed * Math.cos(this.angle)
        this.ySpeed = this.speed * Math.sin(this.angle)
    }

    move() {
        this.x += this.xSpeed
        this.y += this.ySpeed

        // Convert into grid & subgrid coordinates
        this.bulletPos = tools.globalToLocal([this.x, this.y])
    }

    updateAngleAndSpeeds(newAngle) {
        this.xSpeed = this.speed * Math.cos(newAngle)
        this.ySpeed = this.speed * Math.sin(newAngle)
    }

    collidesWith(y, x, r) {
        return this.willCollideWith([x, y], [this.x, this.y], r)
    }

    willCollideWith(xy, xFutureyFuture, r) {
        let x = xy[0]
        let y = xy[1]
        let xFuture = xFutureyFuture[0]
        let yFuture = xFutureyFuture[1]

        // Check if the bullet collides with an object at position x, y with a hit box of a circle radius r
        let granularity = 4 // Go down the fire path in 4 increments
        for (let g = 0; g < granularity; g++) {
            if (Math.sqrt(Math.pow((x - (this.xSpeed*g/granularity) - xFuture),2) + Math.pow(y - (this.ySpeed*g/granularity) - yFuture,2)) < r) {
                return true;
            }
        }
        return false
    }

    positionInNTicks(n) {
        let x = this.startX + this.xSpeed*n
        let y = this.startY + this.ySpeed*n
        return [x, y]
    }
}

module.exports = {
    Bullet: Bullet
}