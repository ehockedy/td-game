import React from "react";
import "../../../../css/endGame.css"
import "../../../../css/game.css"
import { subtractColourHexValues } from "../../../tools.js"
import { Button } from "../../ui_common/display_box.js"

const gameVictoryMessage = "Congratulations, you have successfully held out and defended the camp from the enemy invasion! Karragarra Valley inhabitants thank you for your efforts."
const gameDefeatMessage = "Oh no! The camp has been overwhelmed by the enemy and Karagarra Valley continues to be plagued by monsters. Better luck defending the next one..."

function playerPositionToClass(pos) {
    switch(pos) {
        case 1:
            return "first"
        case 2:
            return "second"
        case 3:
            return "third"
        case 4:
        default:
            return "fourth"
    }
}

function playerPositionToOrdinal(pos) {
    switch(pos) {
        case 1:
            return "st"
        case 2:
            return "nd"
        case 3:
            return "rd"
        case 4:
        default:
            return "th"
    }
}

function PlayerPosition(props) {
    return <span className={`scoreGradientText ${playerPositionToClass(props.position)}`}>
        {props.position}
        <span>
            {playerPositionToOrdinal(props.position)}
        </span>
    </span>
}

function PlayerScore(props) {
    const darkenedBorderColour = subtractColourHexValues(props.colour, "#222222").replace('0x', '#')  // have to replace colour first character for css
    return <div className={`scoreContainer ${props.position === 1 ? 'firstContainer' : ''}`}>
        <PlayerPosition position={props.position}/>
        <div
            style={{
                backgroundColor: props.colour,
                border: `${darkenedBorderColour} solid 4px`,
            }}
            className="nameDisplay"
        >
            {props.name}
        </div>
    </div>
}

function FinalScore(props) {
    return <div className="scoreContainer finalScoreContainer">
        <div className="finalScoreTextColour">
            {"Final Score:"}
        </div>
        <div className="scoreGradientText finalScoreValueColour">
            {props.score}
        </div>
    </div>
}

function PlayerScores(props) {
    return <div>
        {props.playerState.map((player, idx) =>
            <PlayerScore
                key={idx}
                position={idx+1}
                name={props.playerConfig[player.id]?.displayName || player.id}
                colour={props.playerConfig[player.id]?.colour || player.id}
                scale={props.scale}
            />
        )}
    </div>
}

function ReturnToMenuButton(props) {
    return <Button
            content={"Back to menu"}
            onClick={props.onClick}
            classNames='endGameMenuButton'
        />
}

export function EndGameScreen(props) {
    const isVictory = props.gameState == "over.victory"
    return <div className="endGameBackground">
        <div className="endGameScrollableContainer">
            <div className="endGameContentContainer">
                <div className={`endGameTitle ${isVictory ? 'victory-text' : 'defeat-text'}`} >
                    {isVictory ? "Victory!" : "Defeat..."}
                </div>
                <div className="endGameSummary" >
                    {isVictory ? gameVictoryMessage : gameDefeatMessage}
                </div>
                {props.playerState.length == 1 ?
                    // If only a single player, just show their final score not the leaderboard as only one of them
                    <FinalScore score={props.playerState[0].points} scale={props.scale}/> :
                    <PlayerScores playerState={props.playerState} playerConfig={props.playerConfig} scale={props.scale}/>
                }
                <ReturnToMenuButton onClick={props.returnToMainMenuFn} scale={props.scale}/>
            </div>
        </div>
    </div>
}