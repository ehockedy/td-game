const gameImport = require('../js/game.js')
const enemyImport = require("../js/enemies.js");

test("enemies overtaking within square", () => {
    let game = new gameImport.Game(6, 6, 25)
    let row = game.map.mainPath[0].row // The row that the random map starts on - this is the only square we need

    // Add enemy of speed 1
    let e1 = new enemyImport.Enemy(1, 1, game.map.path)
    game.map.addNewEnemy(e1)

    // Move e1 twice
    game.moveEnemies();
    game.moveEnemies();

    // Add enemy with speed 2
    let e2 = new enemyImport.Enemy(1, 2, game.map.path)
    game.map.addNewEnemy(e2)
    
    // Move e1 and e2 once
    game.moveEnemies();
    expect(e1.subcol).toBe(3)
    expect(e2.subcol).toBe(2)
    expect(game.map.map[row][0].enemies).toStrictEqual([e2, e1])

    game.moveEnemies();
    game.moveEnemies();
    expect(e1.subcol).toBe(5)
    expect(e2.subcol).toBe(6)
    expect(game.map.map[row][0].enemies).toStrictEqual([e1, e2]) // e2 has overtaken e1
})

test("enemy movement across squares", () => {
    let game = new gameImport.Game(6, 6, 5)
    let row = game.map.mainPath[0].row // The row that the random map starts on - this is the only square we need

    // Add enemy of speed 2
    let e1 = new enemyImport.Enemy(1, 2, game.map.path)
    game.map.addNewEnemy(e1)

    // Move e1 thrice
    game.moveEnemies();
    game.moveEnemies();
    game.moveEnemies();

    expect(e1.subcol).toBe(1) // 0 -> 2 -> 4 -> 6%5=1
    expect(e1.col).toBe(1)
    expect(game.map.map[row][0].enemies).toStrictEqual([])
    expect(game.map.map[row][1].enemies).toStrictEqual([e1]) // always goes one to the right after first in path
})

test("enemy overtaking as it enters new square", () => {
    let game = new gameImport.Game(6, 6, 5)
    let row = game.map.mainPath[0].row // The row that the random map starts on - this is the only square we need

    // Add enemy of speed 1
    let e1 = new enemyImport.Enemy(1, 1, game.map.path)
    game.map.addNewEnemy(e1)

    // Move e1 5 times
    game.moveEnemies();
    game.moveEnemies();
    game.moveEnemies();
    game.moveEnemies();
    game.moveEnemies();
    expect(e1.col).toBe(1) // e1 now in second square

    // Add enemy with speed 7
    let e2 = new enemyImport.Enemy(1, 7, game.map.path)
    game.map.addNewEnemy(e2)
    
    // Move enemies, e2 should overtake as it moves into new square to join e1
    game.moveEnemies();
    expect(e1.col).toBe(1)    
    expect(e2.col).toBe(1)
    expect(e1.subcol).toBe(1)
    expect(e2.subcol).toBe(2)
    expect(game.map.map[row][0].enemies).toStrictEqual([])
    expect(game.map.map[row][1].enemies).toStrictEqual([e1, e2]) // e2 has overtaken
})

test("enemy overtaking as they both enter new square", () => {
    let game = new gameImport.Game(6, 6, 5)
    let row = game.map.mainPath[0].row // The row that the random map starts on - this is the only square we need

    // Add enemy of speed 1
    let e1 = new enemyImport.Enemy(1, 1, game.map.path)
    game.map.addNewEnemy(e1)

    // Move e1 3 times
    game.moveEnemies();
    game.moveEnemies();
    game.moveEnemies();

    // Add enemy with speed 3
    let e2 = new enemyImport.Enemy(1, 3, game.map.path)
    game.map.addNewEnemy(e2)
    
    // Move e1 and e2 twice. On the second movement, they should both move into a new square, and e2 should overtake
    game.moveEnemies();
    expect(game.map.map[row][0].enemies).toStrictEqual([e2, e1])

    game.moveEnemies();

    expect(e1.col).toBe(1)
    expect(e1.subcol).toBe(0)
    expect(e2.col).toBe(1)
    expect(e2.subcol).toBe(1)
    expect(game.map.map[row][1].enemies).toStrictEqual([e1, e2]) // e2 has overtaken
})