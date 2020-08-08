const enemy = require("./enemies.js");
const gameMap = require('./map.js');

const ENEMY_TYPE = {
    RANDOM: 0,
    RED: 1,
    _MAX: 2
}

// Keep track of the enemies
let enemies = [];

let map;

function getMap() {
    return map.map
}

function moveEnemies() {
    enemies.forEach((e, idx) => {
        e.steps += e.speed  
    })
}

function resolveInteractions() {
    // Check all relevant game objects and see how they interact
    
    // Check if enemy reached end of path
    for (let i = enemies.length-1; i >= 0; i--) {
        if (enemies[i].steps > map.path.length - map.subGridSize/2) {
            enemies.splice(i, 1) // Remove that enemy
        }
    }
}

let counter = 0

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
        if (Math.random() < 0.95) return;
    }
    
    let speedRangeMin = 5
    let speedRangeMax = 15
    // TODO create enemy types
    let randomSpeed = Math.floor(Math.random() * (speedRangeMax - speedRangeMin)) + speedRangeMin;
    enemies.push(new enemy.Enemy(10, randomSpeed))
    counter++
}

function updateGameState() {
    // Update the state of existing enemies
    moveEnemies();

    // See if enemy reached end, bullet hit, etc.
    resolveInteractions();

    // Add random enemy with a random distribution
    addEnemy("random", ENEMY_TYPE.RANDOM);

    // Write the updated state
    let state = {
        "enemies" : [],
    }

    enemies.forEach((e, idx) => {
        state["enemies"].push({
            "name": e.name,
            "pathPos": map.path[e.steps]
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
    getMap
}