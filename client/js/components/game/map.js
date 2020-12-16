import { MAP_ROWS, MAP_COLS, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y} from "../../constants.js"
import { getBoard } from "../../state.js"
import { BaseComponent } from "./base/baseComponent.js"

export class MapComponent extends BaseComponent {
    constructor(scalingFactor=1) {
        super("map")
        this.scalingFactor = scalingFactor

        this.width_px = DEFAULT_SPRITE_SIZE_X*this.scalingFactor*MAP_COLS
        this.height_px = DEFAULT_SPRITE_SIZE_Y*this.scalingFactor*MAP_ROWS
    }

    getWidth() {
        return this.width_px
    }

    getHeight() {
        return this.height_px
    }

    constructMap() {
        this.removeChildren()
        const MAP_SPRITE_SIZE_X = DEFAULT_SPRITE_SIZE_X*this.scalingFactor // Width of a sprite in the map spritesheet
        const MAP_SPRITE_SIZE_Y = DEFAULT_SPRITE_SIZE_Y*this.scalingFactor // Height of a sprite in the map spritesheet

        // A texture is a WebGL-ready image
        // Keep things in a texture cache to make rendering fast and efficient
        let texture = PIXI.Loader.shared.resources["client/img/map_spritesheet.png"].texture

        let rectangle_1 = new PIXI.Rectangle(0, 0, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y);
        let rectangle_2 = new PIXI.Rectangle(0, DEFAULT_SPRITE_SIZE_Y, DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y);

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
                map_square_sprite.scale.x = this.scalingFactor
                map_square_sprite.scale.y = this.scalingFactor

                this.addChild(map_square_sprite);
            }
        }
    }
}