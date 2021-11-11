const fs = require('fs');

/**
 * This script reads the rounds and assesses the difficulty
 */

let rounds = loadConfig("shared/json/rounds.json").rounds
let enemies = loadConfig("shared/json/enemies.json")

function loadConfig(filename) {
    let configJson = fs.readFileSync(filename);
    return JSON.parse(configJson);
}

// Returns the total HP of an enemy, including the sub enemies
function getTotalHP(enemyName) {
    let hp = enemies[enemyName].hp
    enemies[enemyName].subEnemies.forEach((enemy) => {
        hp += getTotalHP(enemy)
    })
    return hp
}

/** For a given enemy, calculate the damage per second
 * aka HP per second
 */
function calculateDPS(enemyName, eps) {
    return getTotalHP(enemyName) * enemies[enemyName].speed * eps
}

function calculateDP10S(enemyName, eps, enemyCount) {
    return calculateDPS(enemyName, eps) * Math.min(eps*10, enemyCount)
}

let previousDPSmeasures = {
    "totalDPS": 0,
    "maxDPS": 0,
    "totalDP10S": 0,
    "maxDP10S": 0,
    "enemies": 1
}
rounds.forEach((round, idx) => {
    let dpsMeasures = {
        "totalDPS": 0,
        "maxDPS": 0,
        "totalDP10S": 0,
        "maxDP10S": 0,
        "enemies": 0
    }
    round.forEach((enemyGroup) => {
        // Check to see if enemies spaced out - this can skew result
        if (enemyGroup.enemiesPerSquarePerSecond <= 0.1) console.log("Warning: more than 10 square between enemies within group")
        enemyGroup.enemies.forEach((enemyName) => {
            // Here we calulate the damage per second coming through, and the damage over a 10 second period
            dps = calculateDPS(enemyName, enemyGroup.enemiesPerSquarePerSecond)
            dp10s = calculateDP10S(enemyName, enemyGroup.enemiesPerSquarePerSecond, enemyGroup.count)

            dpsMeasures.totalDPS += dps
            dpsMeasures.totalDP10S += dp10s

            dpsMeasures.maxDPS = Math.max(dpsMeasures.maxDPS, dps)
            dpsMeasures.maxDP10S = Math.max(dpsMeasures.maxDP10S, dp10s)

            dpsMeasures.enemies += enemyGroup.enemies.length
        })
    })
    console.log("Round:", idx)

    let avgDps = dpsMeasures.totalDPS / dpsMeasures.enemies
    let avgDpsPrev = previousDPSmeasures.totalDPS / previousDPSmeasures.enemies
    console.log(" Avg dps  :", avgDps, idx>0?'('+((avgDps-avgDpsPrev)/avgDpsPrev*100).toString()+'%)':"(-)")

    console.log(" Max dps  :", dpsMeasures.maxDPS, idx>0?'('+((dpsMeasures.maxDPS-previousDPSmeasures.maxDPS)/previousDPSmeasures.maxDPS*100).toString()+'%)':"(-)")

    let avgDp10s = dpsMeasures.totalDP10S / dpsMeasures.enemies
    let avgDp10sPrev = previousDPSmeasures.totalDP10S / previousDPSmeasures.enemies
    console.log(" Avg dp10s:", avgDp10s, idx>0?'('+((avgDp10s-avgDp10sPrev)/avgDp10sPrev*100).toString()+'%)':"(-)")
    console.log(" Max dp10s:", dpsMeasures.maxDP10S, idx>0?'('+((dpsMeasures.maxDP10S-previousDPSmeasures.maxDP10S)/previousDPSmeasures.maxDP10S*100).toString()+'%)':"(-)")

    previousDPSmeasures = dpsMeasures
})

