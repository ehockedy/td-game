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
                <button onClick={()=>{this.props.socket.emit("server/game/start")}}>Start game</button>
            </div>
        )
    }
}