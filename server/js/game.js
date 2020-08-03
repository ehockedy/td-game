const enemy = require("./enemies.js")
const gameMap = require('./map.js')

// Keep track of the enemies
let enemies = [
    new enemy.Enemy(10, 1)
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

function updateGameState() {
    // Remove any dead enemies
    //removeDead()

    // Update the state
    moveEnemies();

    // Write the updated state
    let state = {
        "enemies" : []
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
    map = new gameMap.GameMap(mapY, mapX)
    map.generateMap()
    map.printMap()
    map.calculatePath(subGridXY)
}

module.exports = {
    setUpGame,
    updateGameState,
    getMap
}