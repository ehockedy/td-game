import React from "react";

export class Lobby extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {
        return (
            <div>
                Lobby
                <br/>
                You: {this.props.thisPlayer}
                <br/><br/>
                Players: {this.props.players.map((player) => <li key={player}>{player}</li>)}
                <br/>
                <button onClick={()=>{this.props.socket.emit("server/game/start")}}>Start game</button>
            </div>
        )
    }
}