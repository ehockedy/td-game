import React from "react";
import { NamePlace, NamePlaceEmpty } from "../components/ui_common/playerJoinEntry.js"
import "./../../css/lobby.css"

export class Lobby extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div className="lobby-grid">
                <div className="title">Lobby</div>
                <div className="player-names-container noselect">
                    { Object.keys(this.props.players).map((playerID) =>
                        <NamePlace
                        key={playerID}
                        text={this.props.players[playerID].displayName}
                        onChange={(value) => { this.props.socket.emit("server/player/set/name", playerID, value) }}
                        enabled={playerID === this.props.thisPlayer}
                        ></NamePlace>
                        ) }
                    { Array(this.props.maxPlayers - Object.keys(this.props.players).length).fill(0).map((_, idx) => <NamePlaceEmpty key={idx} initialValue="Waiting for players..."></NamePlaceEmpty>) }
                </div>
                <button className="start-game button display-box slanted" onClick={()=>{this.props.socket.emit("server/game/start")}}>Start game</button>                
            </div>
        )
    }
}