import { Application } from "./application.js"

PIXI.Loader.shared
    .add("client/assets/bullets/bullets.json")
    .add("client/assets/towers/1-rock_thrower/rock_thrower.json")
    .add("client/assets/towers/2-shrapnel_burst/shrapnel_burst.json")
    .add("client/assets/map/base_tiles/base_tiles.json")
    .add("client/assets/map/land_patterns/land_patterns.json")
    .add("client/assets/map/land_decorations/land_decorations.json")
    .add("client/assets/map/path_decorations/path_decorations.json")
    .add("client/assets/map/path_sides/path_sides.json")
    .add("client/assets/infoBoxes/infoBoxes.json")
    .add("client/assets/infoBoxes/towerPopup/towerPopup.json")
    .load(loadConfig)

function loadConfig() {
    fetch("shared/json/gameConfig.json").then((response) => {
        response.json().then((data) => {
            startGame(data)
        })
    })
}

function startGame(config) {
    let socket = io() // Create the WebSocket connection to the server
    let app = new Application(config, socket)
    console.log("New app")
}
