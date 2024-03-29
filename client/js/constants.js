import { randomHexString } from "./tools.js"

export function generateClientConfig(config) {
    const SPRITE_SIZE_MAP_PX = 64
    const SPRITE_SIZE_TOWER_PX = 32
    const MAP_WIDTH = config.MAP_WIDTH * SPRITE_SIZE_MAP_PX
    const MAP_HEIGHT = config.MAP_HEIGHT * SPRITE_SIZE_MAP_PX
    const MAP_BORDER = SPRITE_SIZE_MAP_PX
    const TOWER_MENU_WIDTH = MAP_WIDTH - 500
    const TOWER_MENU_HEIGHT = SPRITE_SIZE_MAP_PX
    const PLAYER_TOOLBAR_WIDTH = SPRITE_SIZE_MAP_PX * 3
    const PLAYER_TOOLBAR_HEIGHT = MAP_HEIGHT
    const BORDER_T = SPRITE_SIZE_MAP_PX*0
    const BORDER_B = SPRITE_SIZE_MAP_PX*2
    const BORDER_L = SPRITE_SIZE_MAP_PX*0
    const BORDER_R = SPRITE_SIZE_MAP_PX*3
    const APP_WIDTH = MAP_WIDTH + BORDER_R + BORDER_L
    const APP_HEIGHT = MAP_HEIGHT +  BORDER_T + BORDER_B
    const LOBBY_WINDOW_WIDTH = APP_WIDTH*0.90
    const LOBBY_WINDOW_HEIGHT = APP_HEIGHT*0.75
    const GAME_CODE_LEN = 4 // 4 is random enough, and easy to remember
    return {
        MAP_ROWS: config.MAP_HEIGHT,
        MAP_COLS: config.MAP_WIDTH,
        SUBGRID_SIZE: config.SUBGRID_SIZE,
        SPRITE_SIZE_MAP: SPRITE_SIZE_MAP_PX,
        SPRITE_SIZE_TOWER: SPRITE_SIZE_TOWER_PX,
        MAP_WIDTH: MAP_WIDTH,
        MAP_HEIGHT: MAP_HEIGHT,
        TOWER_MENU_WIDTH: TOWER_MENU_WIDTH,
        TOWER_MENU_HEIGHT: TOWER_MENU_HEIGHT,
        PLAYER_TOOLBAR_WIDTH: PLAYER_TOOLBAR_WIDTH,
        PLAYER_TOOLBAR_HEIGHT: PLAYER_TOOLBAR_HEIGHT,
        APP_HEIGHT: APP_HEIGHT,
        APP_WIDTH: APP_WIDTH,
        BORDER_T: BORDER_T,
        BORDER_B: BORDER_B,
        BORDER_L: BORDER_L,
        BORDER_R: BORDER_R,
        LOBBY_WINDOW_WIDTH: LOBBY_WINDOW_WIDTH,
        LOBBY_WINDOW_HEIGHT: LOBBY_WINDOW_HEIGHT,
        GAME_CODE_LEN: GAME_CODE_LEN,
        COLOUR: "0x" + randomHexString(6),  // TODO the player should be able to config re this - make the config object a class and have a set colour option
        MAX_PLAYERS: config.MAX_PLAYERS,
        COLOURS: config.colours,
        NUM_ROUNDS_OPTIONS: config.num_rounds_options,
    }
}
