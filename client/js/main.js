import { Application } from "./application.js"

function loadAssets() {
    return new Promise((resolve) => {
       PIXI.Loader.shared
        .add("client/assets/bullets/bullets.json")
        .add("client/assets/towers/1-rock_thrower/rock_thrower.json")
        .add("client/assets/towers/2-shrapnel_burst/shrapnel_burst.json")
        .add("client/assets/towers/3-rock_scatter/rock_scatter.json")
        .add("client/assets/towers/4-sniper/sniper.json")
        .add("client/assets/map/base_tiles/base_tiles.json")
        .add("client/assets/map/land_patterns/land_patterns.json")
        .add("client/assets/map/land_decorations/land_decorations.json")
        .add("client/assets/map/path_decorations/path_decorations.json")
        .add("client/assets/map/path_sides/path_sides.json")
        .add("client/assets/infoBoxes/infoBoxes.json")
        .add("client/assets/infoBoxes/towerPopup/towerPopup.json")
        .add("client/assets/collisions/collision1/collision1.json")
        .add("client/assets/camp/flag1/flag1.json")
        .add("client/assets/camp/tents/tents.json")
        .add("client/assets/camp/tents/tent1.json")
        .add("client/assets/camp/tents/tent2.json")
        .load(resolve)
    })
}

function loadGameConfig() {
    return new Promise((resolve) => {
        fetch("shared/json/gameConfig.json").then((response) => {
            response.json().then((data) => {
                resolve(data)
          })
      })
    })
}

function loadFonts() {
    return new Promise((resolve) => {
        var font = new FontFaceObserver('MarbleWasteland');
        font.load().then(
            resolve
        )
    })
}

function run() {
    Promise.all([
        loadAssets(),
        loadGameConfig(),
        loadFonts(),
    ]).then(([asset, gameConfig, font]) => {
        console.log("Loading complete")
        startGame(gameConfig)
    })
}

function startGame(config) {
    let socket = io() // Create the WebSocket connection to the server
    let app = new Application(config, socket)
    console.log("New app")
}

run()
