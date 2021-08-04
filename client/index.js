import { MainMenu } from "./js/views/main_menu_react.js"
import { Lobby } from "./js/views/lobby_react.js"
import { Game } from "./js/views/game_react.js"
import { io } from "socket.io-client";
import React, { useEffect, useState } from "react";

function loadAssets() {
    return new Promise((resolve) => {
       PIXI.Loader.shared
        .add("client/assets/bullets/bullets.json")
        .add("client/assets/towers/1-rock_thrower/rock_thrower.json")
        .add("client/assets/towers/2-shrapnel_burst/shrapnel_burst.json")
        .add("client/assets/towers/3-rock_scatter/rock_scatter.json")
        .add("client/assets/towers/4-sniper/sniper.json")
        .add("client/assets/towers/5-spear_launcher/spear_launcher.json")
        .add("client/assets/towers/6-flamethrower/flamethrower.json")
        .add("client/assets/towers/7-buzzsaw/buzzsaw.json")
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

function Application(props) {
    const [view, setView] = useState("main-menu")
    const [socket, setSocket] = useState()
    const [gameID, setGameID] = useState()
    const [playerID, setPlayerID] = useState()
    const [playerIDs, setPlayerIDs] = useState()

    useEffect(() => {
        const socket = io()
        socket.on("client/view/lobby", () => {
            setView("lobby")
        })
        socket.on("client/view/game", () => {
            setView("game")
        })
        socket.on("client/players/set", (players) => {
            setPlayerIDs(players)
        })
        setSocket(socket)
        return () => socket.close()
    }, [])

    return (
        <div>
            Game: {gameID}
            {
                view === "main-menu" ? (
                    <MainMenu socket={socket} setPlayerIDHandler={setPlayerID} setGameIDHandler={setGameID}></MainMenu>
                ) :
                view === "lobby" ? (
                    <Lobby socket={socket} gameID={gameID} thisPlayer={playerID} players={playerIDs}></Lobby>
                ) :
                view === "game" ? (
                    <Game socket={socket}></Game>
                ) :
                console.log("INVALID VIEW")
                // TODO add page not found page
            }
        </div>
    )
}

function run() {
    Promise.all([
        loadAssets(),
        loadGameConfig(),
        // loadFonts(),
    ]).then(([asset, gameConfig, font]) => {
        ReactDOM.render(
            <Application config={gameConfig}/>,
            document.getElementById('root')
          );
    })
}

run()