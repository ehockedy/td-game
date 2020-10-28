import { Map } from "../components/map.js"
import { SpriteHandler } from "../sprite_handler.js"


export function startRendering() {
    let spriteHandler = new SpriteHandler()
    let map = new Map(spriteHandler)

    // Once all the compnent have been set, load the sprite files then begin rendering
    spriteHandler.load().load(function() {
        map.registerMapContainer()

        spriteHandler.render()
    })
}