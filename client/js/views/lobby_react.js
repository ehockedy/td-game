import React from "react";
import { NamePlace, NamePlaceEmpty } from "../components/ui_common/playerJoinEntry.js"
import { GameMapSelection } from "../components/ui_common/map.js"
import "./../../css/lobby.css"

export class Lobby extends React.Component {
    constructor(props) {
        super(props)
        this.getNewMap = this.getNewMap.bind(this);
        this.getNewMap()
    }

    getNewMap() {
        this.props.socket.emit("server/map/regenerate")
    }

    render() {
        return (
            <div className="lobby-grid">
                <div className="title">Lobby</div>
                <div className="game-code">GXRV</div>
                <div className="map-regenerate-container">
                    <button className="map-regenerate-button slanted display-box button noselect" onClick={this.getNewMap}>Regenerate map</button>
                    <GameMapSelection
                        mapStructure={this.props.mapStructure} socket={this.props.socket}
                        height={this.props.config.MAP_HEIGHT}
                        width={this.props.config.MAP_WIDTH}
                        mapSpriteSize={this.props.config.SPRITE_SIZE_MAP}
                    ></GameMapSelection>
                </div>
                <div className="player-names-container noselect">
                    { Object.keys(this.props.players).map((playerID) =>
                        <NamePlace
                        key={playerID}
                        text={this.props.players[playerID].displayName}
                        onChange={(value) => { this.props.socket.emit("server/player/set/name", playerID, value) }}
                        enabled={playerID === this.props.thisPlayer}
                        ></NamePlace>
                        ) }
                    { Array(this.props.config.MAX_PLAYERS - Object.keys(this.props.players).length).fill(0).map((_, idx) => <NamePlaceEmpty key={idx} initialValue="Waiting for players..."></NamePlaceEmpty>) }
                </div>
                <button className="start-game button display-box slanted" onClick={()=>{this.props.socket.emit("server/game/start")}}>Start game</button>
            </div>
        )
    }
}