import React from "react";
import { NamePlace, NamePlaceEmpty } from "../components/ui_common/playerJoinEntry.js"
import "./../../css/lobby.css"

export class Lobby extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div>
                Lobby
                <br/>
                You: {this.props.thisPlayer}
                <br/><br/>
                Players: {Object.keys(this.props.players).map((playerID) => <li key={playerID}>{this.props.players[playerID].displayName}</li>)}
                <br/>
                <button onClick={()=>{this.props.socket.emit("server/game/start")}}>Start game</button>
                <span className="player-names-container noselect">
                    { Object.keys(this.props.players).map((playerID) => <NamePlace key={playerID} initialValue={this.props.players[playerID].displayName}></NamePlace>) }
                    { Array(this.props.maxPlayers - Object.keys(this.props.players).length).fill(0).map((_, idx) => <NamePlaceEmpty key={idx} initialValue="Waiting for players..."></NamePlaceEmpty>) }
                </span>
                
            </div>
        )
    }
}