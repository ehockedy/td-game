import React from "react";
import { NamePlace, NamePlaceEmpty } from "../components/ui_common/playerJoinEntry.js"
import { GameMapSelection } from "../components/ui_common/map.js"
import { randomAlphaCharString } from "../tools.js"
import "./../../css/lobby.css"

const INFINITY = 727272
function OptionPicker({currentOption, onOptionChange}) {
    return <span className="optionPicker">
        <button className="optionPickerButton button-inline" onClick={() => {onOptionChange('next')}}>
            <span className="optionPickerButtonText">
                {"<"}
            </span>
        </button>
        <span className="optionPickerValue">
            {currentOption}
        </span>
        <button className="optionPickerButton button-inline" onClick={() => {onOptionChange('prev')}}>
            <span className="optionPickerButtonText">
                {">"}
            </span>
        </button>
    </span>
}

function livesValueToString(value) {
    if (value === INFINITY) return 'infinite' // todo return infinity symbol
    return `${value}`
}

function GameCode({isMobile, gameID}) {
    return <div className={`game-code ${!!isMobile ? 'smallScreenOnly' : 'largeScreenOnly'}`}>
        Game code: <span className="game-code-code">{gameID}</span>
    </div>
}

function MobileSectionTitle({titleText}) {
    return <div className="section-title smallScreenOnly">{titleText}</div>
}


export class Lobby extends React.Component {
    constructor(props) {
        super(props)
        this.livesOptions = [1, 10, 50, 100, INFINITY]
        this.difficultyOptions = ['easy', 'medium', 'hard']
    }

    generateNewRandomMap = () => {
        return this.generateNewSeededMap(randomAlphaCharString(6))
    }

    generateNewSeededMap = (seed) => {
        this.props.socket.emit("server/map/regenerate", seed)
    }

    getNextOption(currentVal, direction, options) {
        const currentIdx = options.indexOf(currentVal)
        if (direction === 'next') {
            return options[(currentIdx + 1) % options.length]
        } else {
            let newVal = currentIdx - 1
            if (newVal < 0) {
                newVal = options.length - 1
            }
            return options[newVal]
        }
    }

    render() {
        return (
            <div className="lobby-grid">
                <GameCode isMobile gameID={this.props.gameID} />
                <div className="player-names-container noselect">
                    <MobileSectionTitle titleText='Player settings:' />
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
                    <GameCode gameID={this.props.gameID}/>
                    <MobileSectionTitle titleText='Map settings:' />
                    <GameMapSelection
                        mapStructure={this.props.mapStructure} socket={this.props.socket}
                        height={this.props.config.MAP_HEIGHT}
                        width={this.props.config.MAP_WIDTH}
                        mapSpriteSize={this.props.config.SPRITE_SIZE_MAP}
                    ></GameMapSelection>
                    <div className="map-options-container">
                        <div className="map-seed-container">
                            <span className="seed-title"> 
                                Seed:
                            </span>
                            <input
                                className="slanted display-box noselect map-seed-input"
                                type="text"
                                maxLength="6"
                                value={this.props.mapSeed}
                                spellCheck="false"
                                onChange={(event) => {this.generateNewSeededMap(event.target.value.toUpperCase())}}
                            ></input>  
                        </div>
                        <button
                            className="map-regenerate-button slanted display-box button noselect"
                            onClick={this.generateNewRandomMap}
                        >
                            Regenerate map
                        </button>
                    </div>
                </div>
                <button
                  className="start-game button display-box slanted noselect"
                  onClick={()=>{
                      this.props.socket.emit("server/game/start")
                    }
                }>
                    Start game
                </button>
                <div className="options noselect">
                    <MobileSectionTitle titleText='Game settings:' />
                    <div className="option">
                        <span className="optionName">
                            Lives
                        </span>
                        <OptionPicker
                            currentOption={livesValueToString(this.props.gameSettings.lives)}
                            onOptionChange={
                                (direction) => {
                                    const newVal = this.getNextOption(this.props.gameSettings.lives, direction, this.livesOptions)
                                    this.props.socket.emit("server/game/settings/set", "lives", newVal)
                                }
                            }
                        />
                    </div>
                    <div className="option">
                        <span className="optionName">
                            Difficulty
                        </span>
                        <OptionPicker
                            currentOption={this.props.gameSettings.difficulty.toUpperCase()}
                            onOptionChange={
                                (direction) => {
                                    const newVal = this.getNextOption(this.props.gameSettings.difficulty, direction, this.difficultyOptions)
                                    this.props.socket.emit("server/game/settings/set", "difficulty", newVal)
                                }
                            }
                        />
                    </div>
                </div>
            </div>
        )
    }
}