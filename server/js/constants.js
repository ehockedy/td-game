let SUBGRID_SIZE = 95

// TODO these are the most important three numbers and need to be in a file shared with the lient config
module.exports = {
    MAP_HEIGHT: 18,
    MAP_WIDTH: 30,
    SUBGRID_SIZE: SUBGRID_SIZE,
    SUBGRID_MIDPOINT: Math.floor(SUBGRID_SIZE/2),
    DEFAULT_HITBOX_RADIUS: Math.floor(SUBGRID_SIZE/3)
}