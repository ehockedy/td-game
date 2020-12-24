const gameImport = require('../js/game.js');
const bulletImport = require("../js/bullet.js");
const pointImport = require("../js/point.js");
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('shared/json/gameConfig.json'));
let SUBGRID_MIDPOINT = Math.floor(config.SUBGRID_SIZE/2)

test ("bullet moves between squares correctly", () => {
    let game = new gameImport.Game(6, 6, 7)

    // Add bullet of speed 1
    let b1 = new bulletImport.Bullet(
        new pointImport.Point(0, 0, 0, SUBGRID_MIDPOINT), // Vertically halfway down the first square
        0, // Horizontally right
        1,
        1,
        1000 // So does not get limited by range
    )
    game.map.addBullet(b1)
    expect(game.map.map[0][0].bullets.length).toBe(1)
    expect(game.map.map[0][1].bullets.length).toBe(0)

    game.moveBullets()
    expect(b1.position.subcol).toBe(1)
    expect(b1.position.subrow).toBe(SUBGRID_MIDPOINT)
    expect(b1.position.col).toBe(0)
    expect(b1.position.row).toBe(0)

    for (let i = 0; i < config.SUBGRID_SIZE; i++) {
        game.moveBullets()
    }
    expect(b1.position.subcol).toBe(1)
    expect(b1.position.subrow).toBe(SUBGRID_MIDPOINT)
    expect(b1.position.col).toBe(1)
    expect(b1.position.row).toBe(0)

    let bullets = 0
    game.map.forEachBullet((bullet) => {
        bullets++
    })
    expect(bullets).toBe(1) // Verify that bullet was removed and added to new square correctly
    expect(game.map.map[0][0].bullets.length).toBe(0)
    expect(game.map.map[0][1].bullets.length).toBe(1)
})

test ("bullet moves diagonally between squares correctly", () => {
    let game = new gameImport.Game(6, 6, config.SUBGRID_SIZE) // TODO note that these tests pass even if different value given for subgrid size

    // Add bullet of speed 1
    let b1 = new bulletImport.Bullet(
        new pointImport.Point(0, 0, SUBGRID_MIDPOINT, SUBGRID_MIDPOINT), // Middle of square
        Math.PI/4, // down and right
        1,
        1,
        1000 // So does not get limited by range
    )
    game.map.addBullet(b1)
    expect(game.map.map[0][0].bullets.length).toBe(1)
    expect(game.map.map[1][1].bullets.length).toBe(0)

    // Should take a number of moves equal to distance from the mid square to target corner before
    // moving into next square. So add 1 to ensure this happens
    let toMove = Math.sqrt(SUBGRID_MIDPOINT*SUBGRID_MIDPOINT*2) // hypotenuse of the triangle
    for (let i = 0; i < toMove; i++) {
        game.moveBullets()
    }
    expect(b1.position.col).toBe(0)
    expect(b1.position.row).toBe(0)

    // Move once more into next square
    game.moveBullets()
    expect(b1.position.subcol).toBe(0)
    expect(b1.position.subrow).toBe(0)
    expect(b1.position.col).toBe(1)
    expect(b1.position.row).toBe(1)

    let bullets = 0
    game.map.forEachBullet(() => {
        bullets++
    })
    expect(bullets).toBe(1) // Verify that bullet was removed and added to new square correctly
    expect(game.map.map[0][0].bullets.length).toBe(0)
    expect(game.map.map[1][1].bullets.length).toBe(1)
})

test ("bullet is removed when out of map", () => {
    let game = new gameImport.Game(6, 6, config.SUBGRID_SIZE)

    // Add bullet of speed 1
    let b1 = new bulletImport.Bullet(
        new pointImport.Point(0, 0, SUBGRID_MIDPOINT, SUBGRID_MIDPOINT), // Middle of square
        Math.PI,
        1,
        1,
        1000 // So does not get limited by range
    )
    game.map.addBullet(b1)

    for (let i = 0; i < SUBGRID_MIDPOINT; i++) {
        game.moveBullets()
    }
    console.log(b1)
    expect(game.map.map[0][0].bullets.length).toBe(1)

    game.moveBullets()
    console.log(b1)
    expect(game.map.map[0][0].bullets.length).toBe(0)

    let bullets = 0
    game.map.forEachBullet(() => {
        bullets++
    })
    expect(bullets).toBe(0) // Verify that no bullets left

})

test ("bullet is removed when travelled further than its range", () => {
    let game = new gameImport.Game(6, 6, config.SUBGRID_SIZE)

    // Add bullet of speed 1
    let b1 = new bulletImport.Bullet(
        new pointImport.Point(0, 0, SUBGRID_MIDPOINT, SUBGRID_MIDPOINT), // Middle of square
        0,
        1,
        1,
        2
    )
    game.map.addBullet(b1)

    for (let i = 0; i < 2*config.SUBGRID_SIZE; i++) {
        game.moveBullets()
    }
    game.resolveInteractions()

    let bullets = 0
    game.map.forEachBullet(() => {
        bullets++
    })
    expect(bullets).toBe(1) // It's still here

    game.moveBullets()
    game.resolveInteractions()

    bullets = 0
    game.map.forEachBullet(() => {
        bullets++
    })
    expect(bullets).toBe(0) // After one more move, bullet has gone
})