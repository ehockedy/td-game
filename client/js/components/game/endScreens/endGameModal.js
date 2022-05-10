import React from "react";
import "../../../../css/endGame.css"
import "../../../../css/game.css"
import { subtractColourHexValues } from "../../../tools.js"
import { Button } from "../../ui_common/display_box.js"

function Title(props) {
    const titleBaseFontSizePx = 120
    const scaledFontSize = titleBaseFontSizePx * props.scale
    const scaledFontSize_px = (scaledFontSize*1.4).toString() + 'px'
    const colourProp = (props.content === 'Victory!') ? 'victory-text' : 'defeat-text'

    // To render the shadow as desired, render the text twice, one with the colours and one with the shadow shade.
    // The shadows goes behing the coloured text, with the letter spacing slightly closer together, which makes the
    // shadow appear to be going into the background.
    // Absolute position children are positioned relative to closest parent with relative/fixed/absolute - in this
    // case the parent element. Absoulte also removes element from the flow, so parent is not affected by height, so
    // need to specifically set height of the parent div which is set to the font size.
    return <div className="end-game-modal-text-container" style={{height: scaledFontSize_px}}>
        <div className={'shadow-text end-game-modal-header-text'}
            style={{
                fontSize: scaledFontSize,
                letterSpacing: '1px'
            }}>
            {props.content}
        </div>
        <div className={`${colourProp} end-game-modal-header-text`}
            style={{
                fontSize: scaledFontSize,
                letterSpacing: '2px'
            }}>
            {props.content}
        </div>
    </div>
}

const gameVictoryMessage = "Congratulations, you have successfully held out and defended the camp from the enemy invasion! Karragarra Valley inhabitants thank you for your efforts."
const gameDefeatMessage = "Oh no! The camp has been overwhelmed by the enemy and Karagarra Valley continues to be plagued by monsters. Better luck defending the next one..."
function GameSummaryMessage(props) {
    const baseFontSize = 36
    const scaledFontSize_px = (baseFontSize * props.scale).toString() + 'px'
    return <div className="game-summary-text" style={{fontSize: scaledFontSize_px}}>
        {props.victory ? gameVictoryMessage : gameDefeatMessage}
    </div>
}

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
    return <span
        style={{
            paddingRight: "2%",
            fontSize: `${props.fontSize}px`,
        }}
        className={`scoreGradientText ${playerPositionToClass(props.position)}`}
    >
        {props.position}
        <span style={{
            fontSize: `${props.fontSize*0.5}px`
        }}>
            {playerPositionToOrdinal(props.position)}
        </span>
    </span>
}

function PlayerScore(props) {
    const darkenedBorderColour = subtractColourHexValues(props.colour, "#222222").replace('0x', '#')  // have to replace colour first character for css
    const positionFontSizeMultipler = props.position === 1 ? 1.5 : 1;  // The first place score is larger
    const baseNameFontSize = 30 * props.scale * positionFontSizeMultipler
    const basePositionFontSize = 80 * props.scale * positionFontSizeMultipler
    const baseNamePaddingSides = 10 * props.scale * positionFontSizeMultipler
    const baseNamePaddingTops = 0 * props.scale * positionFontSizeMultipler
    const baseNameMarginTop = 20 * props.scale * positionFontSizeMultipler
    const baseNameBorderSize = 6 * props.scale * positionFontSizeMultipler
    const baseNameWidth = 300 * props.scale * positionFontSizeMultipler
    return <div className="scoreContainer">
        <PlayerPosition position={props.position} fontSize={basePositionFontSize}/>
        <div
            style={{
                backgroundColor: props.colour,
                border: `${baseNameBorderSize}px solid ${darkenedBorderColour}`,
                fontSize: `${baseNameFontSize}px`,
                paddingTop: `${baseNamePaddingTops}px`,
                paddingBottom: `${baseNamePaddingTops}px`,
                paddingLeft: `${baseNamePaddingSides}px`,
                paddingRight: `${baseNamePaddingSides}px`,
                marginTop: `${baseNameMarginTop}px`,
                width: `${baseNameWidth}px`,
                textAlign: "center",
            }}
            className="nameDisplay"
        >
            {props.name}
        </div>
    </div>
}

function FinalScore(props) {
    const baseFontSizeText = 48
    const baseFontSizeValue = 96
    return <div className="scoreContainer finalScoreContainer">
        <div className="finalScoreTextColour"
            style={{
                fontSize: baseFontSizeText * props.scale
            }}
        >
            {"Final Score:"}
        </div>
        <div className="scoreGradientText finalScoreValueColour"
            style={{
                fontSize: baseFontSizeValue * props.scale,
                marginTop: `${-baseFontSizeValue* props.scale * 0.2}px`,
            }}
        >
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
                name={props.playerConfig[player.id].displayName}
                colour={props.playerConfig[player.id].colour}
                scale={props.scale}
            />
        )}
    </div>
}

function ReturnToMenuButton(props) {
    // Position is fixed, not ideal really, but easiest way to do it given changing number of players in scores components
    return <Button
            content={"Back to menu"}
            onClick={props.onClick}
            style={{
                position: "fixed",
                right: "25%",
                bottom: "10%",
                fontSize: `${40*props.scale}px`,
                borderWidth: `${Math.floor(10*props.scale)}px`,
                boxShadow: `${Math.floor(3*props.scale)}px ${Math.floor(5*props.scale)}px`,
            }}
        />
}


export function EndGameModal(props) {
    // Immediately slides up from bootom into position when rendered
    return (
        <span className="end-game-modal-background slide-up-animation game-canvas noselect">
            <div className="end-game-modal-content">
                <Title content={props.gameState == "over.victory" ? "Victory!" : "Defeat..."} scale={props.scale} />
                <GameSummaryMessage victory={props.gameState == "over.victory"} scale={props.scale} />
                {props.playerState.length == 1 ?
                    // If only a single player, just show their final score not the leaderboard as only one of them
                    <FinalScore score={props.playerState[0].points} scale={props.scale}/> :
                    <PlayerScores playerState={props.playerState} playerConfig={props.playerConfig} scale={props.scale}/>
                }
                <ReturnToMenuButton onClick={props.returnToMainMenuFn} scale={props.scale}/>
            </div>
        </span>
    )
}