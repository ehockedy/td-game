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
                <div className="game-code">Game code: {this.props.gameID}</div>
                <div className="player-names-container noselect">
                    { Object.keys(this.props.players).map((playerID) =>
                        <NamePlace
                            key={playerID}
                            text={this.props.players[playerID].displayName.toUpperCase()}
                            onChange={(value) => { this.props.socket.emit("server/player/set/name", playerID, value) }}
                            onColourChange={(colour) => {this.props.socket.emit("server/player/set/colour", playerID, colour)}}
                            enabled={playerID === this.props.thisPlayer}
                            colour={this.props.players[playerID].colour}
                            colours={this.props.config.COLOURS}
                        ></NamePlace>
                        ) }
                    { Array(this.props.config.MAX_PLAYERS - Object.keys(this.props.players).length).fill(0).map((_, idx) => <NamePlaceEmpty key={idx} initialValue="Waiting for players..."></NamePlaceEmpty>) }
                </div>
                <div className="map-regenerate-container">
                    <GameMapSelection
                        mapStructure={this.props.mapStructure} socket={this.props.socket}
                        height={this.props.config.MAP_HEIGHT}
                        width={this.props.config.MAP_WIDTH}
                        mapSpriteSize={this.props.config.SPRITE_SIZE_MAP}
                    ></GameMapSelection>
                    <button className="map-regenerate-button slanted display-box button noselect" onClick={this.getNewMap}>Regenerate map</button>
                </div>
                <button className="start-game button display-box slanted noselect" onClick={()=>{this.props.socket.emit("server/game/start")}}>Start game</button>
            </div>
        )
    }
}