const enemy = require("./enemies.js")
const gameMap = require('./map.js')

// Keep track of the enemies
let enemies = [
    new enemy.Enemy(10, 10)
];

let map;

function getMap() {
    return map.map
}

function moveEnemies() {
    enemies.forEach((e, idx) => {
        console.log(e)
        e.steps += e.speed  
    })
}

function resolveInteractions() {
    // Check all relevant game objects and see how they interact
    
    // Check if enemy reached end of path
    for (let i = enemies.length-1; i >= 0; i--) {
        if (enemies[i].steps > map.path.length - map.subGridSize) {
            enemies.splice(i, 1) // Remove that enemy
        }
    }
}

function updateGameState() {
    // Update the state
    moveEnemies();

    // See if enemy reached end, bullet hit, etc.
    resolveInteractions();

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