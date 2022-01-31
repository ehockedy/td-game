import React from "react";
import "../../../../css/endGame.css"
import "../../../../css/game.css"

export class EndGameModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            gameState: props.gameState
        }
    }

    // Immediately grows when rendered
    render() {
        return (
            <span className={"end-game-modal-background grow-animation game-canvas"}>
                {this.state.gameState == "over.victory" ? 
                    "VICTORY" :
                    "LOSS"
                }
            </span>
        )
    }
}