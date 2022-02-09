import React from "react";
import "../../../../css/endGame.css"
import "../../../../css/game.css"
import { subtractColourHexValues } from "../../../tools.js"

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
        className={`playerPosition ${playerPositionToClass(props.position)}`}
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
    const baseNameWidth = 160 * props.scale * positionFontSizeMultipler
    return <div className="playerScoreContainer">
        <PlayerPosition position={props.position} fontSize={basePositionFontSize}/>
        <div
            style={{
                backgroundColor: props.colour,
                border: `${baseNameBorderSize}px solid ${darkenedBorderColour}`,
                fontSize: `${baseNameFontSize}px`,
                paddingTop: `${baseNamePaddingTops}px`,
                paddingBottom: `${baseNamePaddingTops}px`,
                paddingLeft: `${baseNamePaddingSides}px`,
                paddingRight: `${baseNamePaddingSides}px`,  // more padding on the right
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


export function EndGameModal(props) {
    // Immediately slides up from bootom into position when rendered
    return (
        <span className="end-game-modal-background slide-up-animation game-canvas">
            <div className="end-game-modal-content">
                <Title content={props.gameState == "over.victory" ? "Victory!" : "Defeat..."} scale={props.scale} />
                <GameSummaryMessage victory={props.gameState == "over.victory"} scale={props.scale} />
                <PlayerScores playerState={props.playerState} playerConfig={props.playerConfig} scale={props.scale}/>
            </div>
        </span>
    )
}