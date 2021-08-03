import { BaseComponent } from "./js/components/game/base/baseComponent.js"
import { MainMenu } from "./js/views/main_menu_react.js"
import { Lobby } from "./js/views/lobby_react.js"
import { io } from "socket.io-client";
import React, { useEffect, useState } from "react";

function Application() {
    const [view, setView] = useState("main-menu")
    const [socket, setSocket] = useState()

    useEffect(() => {
        const socket = io()
        socket.on("client/view/lobby", () => {
            setView("lobby")
        })
        setSocket(socket)
        return () => socket.close()
    }, [])

    return (
        <div>
            {
                view === "main-menu" ? (
                    <MainMenu socketClient={socket}></MainMenu>
                ) :
                view === "lobby" ? (
                    <Lobby></Lobby>
                ) :
                console.log("INVALID VIEW")
                // TODO add page not found page
            }
        </div>
    )
}


ReactDOM.render(
    <Application/>,
    document.getElementById('root')
  );