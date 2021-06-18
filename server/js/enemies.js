const crypto = require('crypto');
const fs = require('fs');

let enemyConfig = JSON.parse(fs.readFileSync('shared/json/enemies.json'));
const sizeMap = {
    "small": 4,
    "medium": 2,
    "large": 1
}

class Enemy {
    /**
     * 
     * @param {String} type The type of enemy to create
     * @param {Object} path Array of coordinates that tht enemy will follow
     * @param {Object} subgridSize Size of the subgrid of the map
     */
    constructor(type, path, subgridSize) {
        this.type = type
        this.hp = enemyConfig[type].hp;
        this.speed = enemyConfig[type].speed;
        this.steps = 0  // How many steps taken through the map path
        this.name = crypto.randomBytes(20).toString('hex');
        this.hitboxRadius = subgridSize/sizeMap[enemyConfig[type].size]

        this.nearCentreRadius = this.hitboxRadius / 2  // Distance from centre point that is considered near. Used to determine when to turn.
        this.rotation = 0  // angle in radians that enemy is facing, starting at 0 which is right/east

        this.path = path // Reference to the object in map
        this.subgridSize = subgridSize
        this.position = path[this.steps]
        this.row = this.position.row
        this.col = this.position.col
        this.subrow = this.position.subrow
        this.subcol = this.position.subcol
        this.x = this.position.x
        this.y = this.position.y

        // Update specific variables
        this.isHit = false  // Whether the enemy has been hit in that specific update
        this.collisionAngles = []  // Array of angles for bullet that collide during a given update

        this.collidedBullets = []  // If a bullet is piercing, store its name here so does not register another hit
    }

    step() {
        this.setPosition(this.steps + this.speed)
        this.isHit = false  // Reset hit status
        this.collisionAngles = []
    }

    setPosition(steps) {
        this.steps = steps
        if (steps < this.path.length) {
            this.position = this.path[this.steps]

            this.row = this.position.row
            this.col = this.position.col
            this.subrow = this.position.subrow
            this.subcol = this.position.subcol

            this.x = this.position.x
            this.y = this.position.y
        }
    }

    // Given the type of tile the enemy is on determine if it needs to rotate itself to be facing a certain direction
    // tile type is in format '<direction>' or '<direction><direction>' if corner.
    // <direction> can be u, d, l, or r.
    // First direction is the direction of travel through the firt half of the square, second direction is direction through the second half od the square
    turn(tileType) {
        if (tileType.length != 2) return // No need to rotate if a straight path
        this.forceTurn(tileType)
    }

    // Makes the enemy check change of direction no matter what
    forceTurn(tileType) {
        let firstDir = this._rotationAngleSwitch(tileType[0])  // Direction the enemy sprite is facing when it enters it's current square
        let secondDir = this._rotationAngleSwitch(tileType[1]) // Direction enemy sprite faces when leasing the sqare i.e. moves from first to second angle

        let firstDist = this._distanceToCentre(tileType[0])  // Distance from the current position, if enemy travelling in direction that it entered the grid square, 0 otherwise.
        let secondDist = this._distanceToCentre(tileType[1]) // Distance from the current position, if enemy travelling in direction that it leaves the grid square, 0 otherwise.

        // If is near the centre of the circle, then start to rotate
        if (firstDist < this.nearCentreRadius && secondDist < this.nearCentreRadius) {
            let midwayAngle = this._getMidwayAngle(firstDir, secondDir)  // Angle to be rotated at if exactly at centre of square
            // Rotate a percentage of the way between starting angle and ending angle depending how close to centre of grid square
            this.rotation = (secondDist == 0) ?  // In the first half of the square
                firstDir + midwayAngle * (1 - firstDist/this.nearCentreRadius) :  // Rotate between starting angle and midway angle
                secondDir - midwayAngle * (1 - secondDist/this.nearCentreRadius)  // Rotate between midway andle and the ending angle
        } else {  // Out of centre and have rotated, ensure facing correct direction
            this.rotation = (secondDist == 0) ? firstDir : secondDir
        }
    }

    // Given a direction of travel, determine the distance to the centre of the grid square
    _distanceToCentre(direction) {
        return (direction == 'r' || direction =='l') ?
            Math.abs(this.subcol - Math.floor(this.subgridSize/2)) :
            Math.abs(this.subrow - Math.floor(this.subgridSize/2))
    }

    _rotationAngleSwitch(direction) {
        let rotation = 0
        switch(direction) {
            case 'r':
                rotation = 0
                break
            case 'd':
                rotation = 90
                break
            case 'l':
                rotation = 180
                break
            case 'u':
                rotation = 270
                break
        }
        return rotation
    }

    _getMidwayAngle(firstAngle, secondAngle) {
        if (firstAngle == 0 && secondAngle == 270) firstAngle = 360
        if (firstAngle == 270 && secondAngle == 0) secondAngle = 360
        return (secondAngle - firstAngle) / 2
    }

    positionInNSteps(n) {
        let futureStep = this.steps + (this.speed * n)
        if (futureStep >= this.path.length) return this.path[this.path.length - 1]
        return this.path[futureStep]
    }

    // Returns whether the bullet should be removed
    handleCollision(bullet) {
        // Return immediately if bullet already hit this enemy and is still around
        if (this.collidedBullets.includes(bullet.name)) return false
        this.collidedBullets.push(bullet.name)

        this.isHit = true
        this.hp -= bullet.damage

        // get angle from enemy centre to bullet
        const xdiff = bullet.position.x - this.x
        const ydiff = bullet.position.y - this.y
        const angle = Math.atan2(ydiff, xdiff)
        this.collisionAngles.push(angle)
        return bullet.collide()  // returns false if bullet continues to move
    }

}

module.exports = {
    Enemy: Enemy
}
