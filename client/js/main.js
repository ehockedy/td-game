import { Application } from "./application.js"

PIXI.Loader.shared
    .add("client/img/map_spritesheet.png")
    .add("client/img/enemy_spritesheet.png")
    .add("client/img/tower_spritesheet.png")
    .add("client/img/bullet_spritesheet.png")
    .add("client/img/infoBox1.png")
    .load(startGame)

function startGame() {
    let app = new Application()
    console.log("New app")
}
