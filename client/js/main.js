import { Application } from "./application.js"

PIXI.Loader.shared
    .add("client/img/enemy_spritesheet.png")
    .add("client/img/tower_spritesheet.png")
    .add("client/img/bullet_spritesheet.png")
    .add("client/img/infoBox1.png")
    .add("client/img/rocks.json")
    .add("client/img/map_tiles.json")
    .add("client/img/valley_walls.json")
    .load(loadConfig)

function loadConfig() {
    fetch("shared/json/gameConfig.json").then((response) => {
        response.json().then((data) => {
            startGame(data)
        })
    })
}

function startGame(config) {
    let app = new Application(config)
    console.log("New app")
}
