const enemy = require("./enemies.js");
const tower = require("./tower.js");
const bullet = require("./bullet.js");
const gameMap = require('./map.js');
const config = require('./constants.js')
const crypto = require('crypto');

const ENEMY_TYPE = {
    RANDOM: 0,
    RED: 1,
    _MAX: 2
}

const TOWER_TYPE = {
    BLUE: 0 // Single shot basic tower
}

// Keep track of the enemies
let enemies = [];

// Keep track of the towers
let towers = []

let bullets = []

let map;

function getMapStructure() {
    return map.map
}

function getMap() {
    return map
}

function moveEnemies() {
    enemies.forEach((e, idx) => {
        e.steps += e.speed
        if (e.steps < map.path.length) {
            e.row = map.path[e.steps][0]
            e.col = map.path[e.steps][1]
        }
    })
}


function calculateAngle(row1, col1, row2, col2) {
    return Math.atan2((row2-row1), (col2-col1))
}


function moveTowers() {
    // Check if an enemy is within shoot range, and turn tower if it is
    towers.forEach((tower) => {
        let canHit = false;
        //let enemyToShoot;
        for (let coordIdx=0; coordIdx < tower.shootRangePath.length; coordIdx++) {
            let coord = tower.shootRangePath[coordIdx]
            for (let enemyIdx=0; enemyIdx < enemies.length; enemyIdx++) {
                let enemy = enemies[enemyIdx]
                if (coord[0] == enemy.row && coord[1] == enemy.col) {
                    canHit = true;
                    tower.angle = calculateAngle(tower.row, tower.col, enemy.row, enemy.col) // TODO determine angle base off where enemy will be
                    let newBullet = new bullet.Bullet(
                        [tower.row, tower.col, Math.floor(config.SUBGRID_SIZE/2), Math.floor(config.SUBGRID_SIZE/2)],
                        map.path[enemy.steps+enemy.speed*5],
                        5, // dmg TODO this should be determined by type of tower, pass that through eventually
                        10, // spd TODO same as above
                        tower.range,
                        tower.name)
                    if (tower.fireTick == 0) bullets.push(newBullet)
                    if (bullets.length == 1) {
                        bullets[0].name = "FIRST"
                        //break;
                    }
                    break;
                }
            }
            if (canHit) break;
        }
        tower.fireTick = (tower.fireTick + 1) % tower.rateOfFire
        if (!canHit) tower.fireTick = 0
    });
}

function moveBullets() {
    bullets.forEach((bullet) => {
        bullet.move()
    })
}

function resolveInteractions() {
    // Check all relevant game objects and see how they interact
    // Check collision between enemies and bullets
    for (let e = enemies.length-1; e >= 0; e--) {
        for (let b = bullets.length-1; b >= 0; b--) {
            //let dist = bullets[b].calculateDistanceFrom(enemies[e].row*config.SUBGRID_SIZE + Math.floor(config.SUBGRID_SIZE/2), enemies[e].col*config.SUBGRID_SIZE + Math.floor(config.SUBGRID_SIZE/2))
            // TOD) make enemy size a thing
            if(bullets[b].collidesWith(
                enemies[e].row*config.SUBGRID_SIZE + Math.floor(config.SUBGRID_SIZE/2), // TODO make abolute grid value a thing
                enemies[e].col*config.SUBGRID_SIZE + Math.floor(config.SUBGRID_SIZE/2),
                Math.floor(config.SUBGRID_SIZE/2))) {
                bullets.splice(b, 1) // Remove that bullet
            }
            //if (bullets[b].name == "FIRST") console.log(dist, "\n")
        }
    }
    
    // Check if enemy reached end of path
    for (let i = enemies.length-1; i >= 0; i--) {
        if (enemies[i].steps > map.path.length - map.subGridSize/2) {
            enemies.splice(i, 1) // Remove that enemy
        }
    }

    for (let i = bullets.length-1; i >= 0; i--) {
        if (Math.sqrt(
                Math.pow(bullets[i].bulletPos[0] - bullets[i].bulletPosStart[0], 2) +
                Math.pow(bullets[i].bulletPos[1] - bullets[i].bulletPosStart[1], 2)
            ) > bullets[i].range) {
            bullets.splice(i, 1) // Remove that bullet
        }
    }
}

let counter = 0 // Temporary

/**
 * Adds an enemy based off a generation strategy
 * Strategy is something like fixed rate, random within a distribution
 * @param {String} distributionPattern pattern to generate enemies
 * @param {Number} enemyType type of enemy to add. ENEMY_TYPE.RANDOM (0) will generate a random enemy
 */
function addEnemy(distributionPattern, enemyType) {
    if (counter > 30) return;
    if (distributionPattern == "random") {
        // 10% chance to spawn new enemy
        if (Math.random() < 0.95) return; //0.95) return;
    }
    
    let speedRangeMin = 6
    let speedRangeMax = 6
    // TODO create enemy types
    let randomSpeed = Math.floor(Math.random() * (speedRangeMax - speedRangeMin)) + speedRangeMin;
    enemies.push(new enemy.Enemy(10, randomSpeed))
    counter++
}

function addTower(name, type, player, row, col) {
    let newTower = new tower.Tower(name, type, player, row, col)
    console.log(map.mainPath)
    newTower.calculateShootPath(map.mainPath)
    towers.push(newTower)
}

function updateGameState() {
    // Update the state of existing enemies
    moveEnemies();

    // Move any bullets
    moveBullets();

    // Decide which enemy the ower aims at (if any) and shoot
    moveTowers();

    // See if enemy reached end, bullet hit, etc.
    resolveInteractions();

    // Add random enemy with a random distribution
    addEnemy("random", ENEMY_TYPE.RANDOM);

    // Write the updated state
    let state = {
        "enemies" : {
            "hash": "",
            "objects": []
        },
        "towers" : {
            "hash": "",
            "objects": []
        },
        "bullets" : {
            "objects": []
        }
    }
    let hash = crypto.createHash("sha256")
    enemies.forEach((e, idx) => {
        state["enemies"]["objects"].push({
            "name": e.name,
            "pathPos": map.path[e.steps]
        })
        hash.update(e.name)
    })
    state["enemies"]["hash"] = hash.digest("hex")

    //hash = crypto.createHash("sha256")
    towers.forEach((t, idx) => {
        state["towers"]["objects"].push({
            "name": t.name,
            "angle": t.angle
        })
        //hash.update(t.name)
    })

    bullets.forEach((b) => {
        state["bullets"]["objects"].push({
            "name": b.name,
            "bulletPos": b.bulletPos
        })
    })

    return state;
}

function setUpGame(mapX, mapY, subGridXY) {
    map = new gameMap.GameMap(mapY, mapX, subGridXY)
    map.generateMap()
    map.printMap()
    map.calculatePath()
}

module.exports = {
    setUpGame,
    updateGameState,
    getMap,
    getMapStructure,
    addTower
}