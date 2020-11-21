export const DEFAULT_SPRITE_SIZE_X = 32
export const DEFAULT_SPRITE_SIZE_Y = 32

// TODO these are the most important three numbers and need to be in a file shared with the server config
export const MAP_ROWS = 18;
export const MAP_COLS = 30;
export const SUBGRID_SIZE = 95;

export const MAP_WIDTH = MAP_COLS * DEFAULT_SPRITE_SIZE_X
export const MAP_HEIGHT = MAP_ROWS * DEFAULT_SPRITE_SIZE_Y

export const RIGHT_TOOLBAR_WIDTH = 5*DEFAULT_SPRITE_SIZE_X
export const RIGHT_TOOLBAR_HEIGHT = MAP_HEIGHT/2

export const BOTTOM_TOOLBAR_WIDTH = MAP_WIDTH + RIGHT_TOOLBAR_WIDTH
export const BOTTOM_TOOLBAR_HEIGHT = 3*DEFAULT_SPRITE_SIZE_Y

export const APP_WIDTH = MAP_WIDTH + RIGHT_TOOLBAR_WIDTH
export const APP_HEIGHT = MAP_HEIGHT + BOTTOM_TOOLBAR_HEIGHT

export const LOBBY_WINDOW_WIDTH = APP_WIDTH*0.8
export const LOBBY_WINDOW_HEIGHT = APP_HEIGHT*0.8

export const GAME_CODE_LEN = 4 // 4 is random enough, and easy to remember