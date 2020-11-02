export let DEFAULT_SPRITE_SIZE_X = 32
export let DEFAULT_SPRITE_SIZE_Y = 32

// TODO these are the most important three numbers and need to be in a file shared with the server config
export let MAP_ROWS = 18;
export let MAP_COLS = 30;
export let SUBGRID_SIZE = 95;

export let MAP_WIDTH = MAP_COLS * DEFAULT_SPRITE_SIZE_X
export let MAP_HEIGHT = MAP_ROWS * DEFAULT_SPRITE_SIZE_Y

export let RIGHT_TOOLBAR_WIDTH = 5*DEFAULT_SPRITE_SIZE_X
export let RIGHT_TOOLBAR_HEIGHT = MAP_HEIGHT/2

export let BOTTOM_TOOLBAR_WIDTH = MAP_WIDTH + RIGHT_TOOLBAR_WIDTH
export let BOTTOM_TOOLBAR_HEIGHT = 3*DEFAULT_SPRITE_SIZE_Y

export let APP_WIDTH = MAP_WIDTH + RIGHT_TOOLBAR_WIDTH
export let APP_HEIGHT = MAP_HEIGHT + BOTTOM_TOOLBAR_HEIGHT
