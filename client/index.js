import { MainMenu } from "./js/views/main_menu_react.js"
import { Lobby } from "./js/views/lobby_react.js"
import { Game } from "./js/views/game_react.js"
import { SimulationView } from "./js/views/simulation_view.js"
import { io } from "socket.io-client";
import { GameMapBackground } from "./js/components/ui_common/map.js"
import React, { useEffect, useState } from "react";
import { generateClientConfig } from "./js/constants.js"

function loadAssets(enemyConfig) {
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
        for (let type in enemyConfig) {
            PIXI.Loader.shared.add(enemyConfig[type].textureAtlasFile)
        }

        // Load all queued assets, then call resolve when done
        PIXI.Loader.shared.load(resolve)
    })
}

function loadConfig(configType) {
    return new Promise((resolve) => {
        fetch(configType).then((response) => {
            response.json().then((data) => {
                resolve(data)
          })
      })
    })
}

function Application(props) {
    const [view, setView] = useState("main-menu")
    const [socket, setSocket] = useState()
    const [gameID, setGameID] = useState()
    const [playerID, setPlayerID] = useState()
    const [players, setPlayers] = useState()
    const [map, setMap] = useState()
    const [gameSettings, setGameSettings] = useState()
    const config = generateClientConfig(props.config)

    useEffect(() => {
        const socket = io()
        socket.on("client/view/lobby", () => {
            setView("lobby")
        })
        socket.on("client/view/game", () => {
            setView("game")
        })
        socket.on("client/view/simulation", () => {
            setView("simulation")
        })
        socket.on("client/players/set", (players) => {
            setPlayers(players)
        })
        socket.on("client/map/set", (map) => {
            setMap(map)
        })
        socket.on("client/gameSettings/set", (gameSettings) => {
            setGameSettings(gameSettings)
        })
        setSocket(socket)
        return () => socket.close()
    }, [])

    const resetState = () => {
        setGameID()
        setPlayerID()
        setPlayers()
        setMap()
        setGameSettings()
    }

    const returnToMainMenu = () => {
        setView("main-menu")
        socket.emit("server/player/disconnect", playerID)
        resetState()
    }

    return (
        <div>
            {
                view == "main-menu" || view == "lobby" ? (
                    <GameMapBackground mapSpriteSize={config.SPRITE_SIZE_MAP}></GameMapBackground>
                ) : null
            }
            {
                view === "main-menu" ? (
                    <MainMenu socket={socket} setPlayerIDHandler={setPlayerID} setGameIDHandler={setGameID}></MainMenu>
                ) :
                view === "lobby" ? (
                    <Lobby socket={socket} gameID={gameID} thisPlayer={playerID} players={players} config={config} mapStructure={map} gameSettings={gameSettings}></Lobby>
                ) :
                view === "game" ? (
                    <Game
                        socket={socket}
                        config={config}
                        enemyConfig={props.enemyConfig}
                        bulletConfig={props.bulletConfig}
                        thisPlayer={playerID}
                        players={players}
                        gameSettings={gameSettings}
                        returnToMainMenuFn={returnToMainMenu}>
                    </Game>
                ) :
                view === "simulation" ? (
                    <SimulationView socket={socket} config={config}></SimulationView>
                ) :
                console.log("INVALID VIEW")
                // TODO add page not found page
            }
        </div>
    )
}

function renderApp(gameConfig, enemyConfig, bulletConfig) {
    ReactDOM.render(
        <Application config={gameConfig} enemyConfig={enemyConfig} bulletConfig={bulletConfig}/>,
        document.getElementById('root')
    );
}

function run() {
    // Load config
    Promise.all([
        loadConfig("shared/json/gameConfig.json"),
        loadConfig("shared/json/enemies.json"),
        loadConfig("shared/json/bullets.json"),
    ]).then(([gameConfig, enemyConfig, bulletConfig]) => {
        // Queue then load assets
        loadAssets(enemyConfig).then(() => {
            // Start rendering the application
            renderApp(gameConfig, enemyConfig, bulletConfig)
        })
    })
}

run()