import { MainMenu } from "./js/views/main_menu_react.js"
import { Lobby } from "./js/views/lobby_react.js"
import { Game } from "./js/views/game_react.js"
import { SimulationView } from "./js/views/simulation_view.js"
import { io } from "socket.io-client";
import { GameMapBackground } from "./js/components/ui_common/map.js"
import React, { useEffect, useState } from "react";
import { generateClientConfig } from "./js/constants.js"
import { getCookie, setCookie } from "./js/cookieHelpers.js"
import './css/index.css'

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
    const [socket, setSocket] = useState(io())  // This creates socket io connection with server
    const [gameID, setGameID] = useState()
    const [playerID, setPlayerID] = useState()
    const [players, setPlayers] = useState()
    const [map, setMap] = useState()
    const [mapSeed, setMapSeed] = useState()
    const [gameSettings, setGameSettings] = useState()
    const config = generateClientConfig(props.config)

    useEffect(() => {
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
        socket.on("client/map/set", (map, seed) => {
            setMap(map)
            setMapSeed(seed)
        })
        socket.on("client/gameSettings/set", (gameSettings) => {
            setGameSettings(gameSettings)
        })

        // Check if the user id is stored in a cookie
        const id = getCookie("id")
        if (id == "") {
            // First time user has come, generate new id
            socket.emit("server/player/getID", (id) => {
                setPlayerID(id)
                setCookie("id", id, 365)  // set for a year
            })
        } else {
            // Use existing id
            socket.emit("server/player/setID", id)
            setPlayerID(id)
        }

        return () => socket.close()
    }, [socket])

    const resetState = () => {
        setGameID()
        setPlayerID()
        setPlayers()
        setMap()
        setGameSettings()
    }

    const returnToMainMenu = () => {
        setView("main-menu")
        socket.emit("server/player/disconnect", playerID)  // remove player from the session
        resetState()
        socket.close()
        setSocket(io())  // Start fresh connection
    }

    return (
        <>
            {
                view == "main-menu" || view == "lobby" ? (
                    <GameMapBackground mapSpriteSize={config.SPRITE_SIZE_MAP}></GameMapBackground>
                ) : null
            }
            {
                view === "main-menu" ? (
                    <MainMenu
                        socket={socket}
                        playerID={playerID}
                        setGameIDHandler={setGameID}>
                    </MainMenu>
                ) :
                view === "lobby" ? (
                    <Lobby
                        socket={socket}
                        gameID={gameID}
                        thisPlayer={playerID}
                        players={players}
                        config={config}
                        mapStructure={map}
                        mapSeed={mapSeed}
                        gameSettings={gameSettings}
                    />
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
                        gameID={gameID}
                        returnToMainMenuFn={returnToMainMenu}>
                    </Game>
                ) :
                view === "simulation" ? (
                    <SimulationView
                        socket={socket}
                        config={config}
                        enemyConfig={props.enemyConfig}
                        bulletConfig={props.bulletConfig}
                    ></SimulationView>
                ) :
                null
                // TODO add page not found page
            }
        </>
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