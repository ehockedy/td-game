const point = require('../js/point.js')
const config = require('../js/constants.js')

test("converts local coordinates to global correctly", () => {
    let testPoint = new point.Point(30, 20, config.SUBGRID_MIDPOINT, config.SUBGRID_MIDPOINT)
    expect(testPoint.col).toBe(30)
    expect(testPoint.row).toBe(20)
    expect(testPoint.subcol).toBe(config.SUBGRID_MIDPOINT)
    expect(testPoint.subrow).toBe(config.SUBGRID_MIDPOINT)
    expect(testPoint.x).toBe(30*config.SUBGRID_SIZE + config.SUBGRID_MIDPOINT)
    expect(testPoint.y).toBe(20*config.SUBGRID_SIZE + config.SUBGRID_MIDPOINT)
})

test("converts global coordinates to local correctly", () => {
    let testPoint = new point.Point(300, 200)
    expect(testPoint.col).toBe(Math.floor(300 / config.SUBGRID_SIZE))
    expect(testPoint.row).toBe(Math.floor(200 / config.SUBGRID_SIZE))
    expect(testPoint.subcol).toBe(Math.floor(300 % config.SUBGRID_SIZE))
    expect(testPoint.subrow).toBe(Math.floor(200 % config.SUBGRID_SIZE))
    expect(testPoint.x).toBe(300)
    expect(testPoint.y).toBe(200)
})