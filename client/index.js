import { BaseComponent } from "./js/components/game/base/baseComponent.js"
import { MainMenu } from "./js/views/main_menu_react.js"
import { io } from "socket.io-client";

const socket = io()
ReactDOM.render(
    <MainMenu
        socketClient={socket}
    ></MainMenu>,
    document.getElementById('root')
  );