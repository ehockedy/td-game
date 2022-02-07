import React from "react";
import "../../../../css/endGame.css"
import "../../../../css/game.css"

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

export function EndGameModal(props) {
    // Immediately slides up from bootom into position when rendered
    return (
        <span className="end-game-modal-background slide-up-animation game-canvas">
            <div className="end-game-modal-content">
                <Title content={props.gameState == "over.victory" ? "Victory!" : "Defeat..."} scale={props.scale} />
                <GameSummaryMessage victory={props.gameState == "over.victory"} scale={props.scale} />
            </div>
        </span>
    )
}