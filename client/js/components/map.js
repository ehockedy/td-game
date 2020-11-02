import { MAP_ROWS, MAP_COLS, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y} from "../constants.js"
import { getBoard } from "../state.js"
import { BaseComponent } from "./base/baseComponent.js"

export class MapComponent extends BaseComponent{
    constructor(sprite_handler) {
        super(sprite_handler, "map")
    }

    registerContainer() {
        super.registerContainer()
        this.constructMap(this.container)
    }

    constructMap(mapContainer) {
        const MAP_SPRITE_SIZE_X = DEFAULT_SPRITE_SIZE_X // Width of a sprite in the map spritesheet
        const MAP_SPRITE_SIZE_Y = DEFAULT_SPRITE_SIZE_Y // Height of a sprite in the map spritesheet

        // A texture is a WebGL-ready image
        // Keep things in a texture cache to make rendering fast and efficient
        let texture = PIXI.Loader.shared.resources["client/img/map_spritesheet.png"].texture

        let rectangle_1 = new PIXI.Rectangle(0, 0, MAP_SPRITE_SIZE_X, MAP_SPRITE_SIZE_Y);
        let rectangle_2 = new PIXI.Rectangle(0, MAP_SPRITE_SIZE_Y, MAP_SPRITE_SIZE_X, MAP_SPRITE_SIZE_Y);

        let green_square_texture = new PIXI.Texture(texture, rectangle_1)
        let brown_square_texture = new PIXI.Texture(texture, rectangle_2)

        for (let r = 0; r < MAP_ROWS; r++) {
            for (let c = 0; c < MAP_COLS; c++) {
                // Default to 0 aka grass
                var map_square_sprite = new PIXI.Sprite(green_square_texture);

                if (getBoard()[r][c]["value"] == 1) {
                    map_square_sprite = new PIXI.Sprite(brown_square_texture);
                }
                map_square_sprite.y = r * MAP_SPRITE_SIZE_Y
                map_square_sprite.x = c * MAP_SPRITE_SIZE_X
                map_square_sprite.name = "map_" + r.toString() + "_" + c.toString()

                mapContainer.addChild(map_square_sprite);
            }
        }
    }
}