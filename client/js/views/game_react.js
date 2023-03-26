import React from "react";
import { GameRenderer} from "./game.js"
import { SpriteHandler } from "../sprite_handler.js"
import { EndGameModal } from "../components/game/endScreens/endGameModal.js"
import "../../css/game.css"

export class Game extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            gameState : "active",
            playerState: [],  // Holds game info such as money and score, is not updated regularly though - only when gameState
            width_px: this.props.config.APP_WIDTH,
            height_px: this.props.config.APP_HEIGHT,
            globalResizeMultiplier: 1
        }
        this.width_px_original = this.props.config.APP_WIDTH
        this.height_px_original = this.props.config.APP_HEIGHT
        this.margin = 24 // in px
        this.resizeFactor = 1  // todo pass in via props
    }

    componentDidMount() {
        // TODO remove this on object removal
        this.props.socket.on("client/game/state/set", (newGameState, newPlayerState) => {
            this.setState({
                gameState: newGameState,
                playerState: newPlayerState
            })
        })

        let clientConfig = this.props.config

        // Pass the rendered canvas element to the sprite handler and start rendering the game.
        // This method of passing it through and resising it here means the size is controlled externally
        // and not within the sprite handler class, and as such other components such as the end of game modal
        // can have their size controller as well.
        const gameCanvas = document.getElementById("gameCanvas");
        gameCanvas.classList.add("display-box-shadowless")

        // This holds the PIXI application and all the sprites
        const spriteHandler = new SpriteHandler(clientConfig.APP_WIDTH, clientConfig.APP_HEIGHT, 1, gameCanvas)

        // View is the scene that user is currently on
        this.view = new GameRenderer(
            this.props.socket,
            spriteHandler,
            clientConfig,
            this.props.enemyConfig,
            this.props.bulletConfig,
            this.props.thisPlayer,
            this.props.players,
            this.props.gameSettings)
        this.view.loadData().then(()=>{
            this.view.startRendering()
        })

        // Listen for window resize event
        window.addEventListener('resize', this.handleResize)

        // Trigger the reisze so that intial render is right dimensions
        this.handleResize()
    }

    componentWillUnmount() {
        this.view.destructor()
        this.props.socket.off("client/game/state/set")
    }

    getGameDimensions = () => {
        // We only want to resize if the browser window is made smaller than the game view. If not, then sprites become too big and look slightly blurry. 
        let resizeMultiplier = 1

        const windowWidth = Math.min(window.outerWidth, window.innerWidth);
        const windowHeight = Math.min(window.outerHeight, window.innerHeight);
        if (windowHeight < this.height_px_original || windowWidth < this.width_px_original) {
            // Keep ratio the same, so see if width or height needs to be scaled the most to be visible
            resizeMultiplier = Math.min((windowWidth - this.margin) / this.width_px_original, (windowHeight - this.margin) / this.height_px_original) * this.resizeFactor
        }

        if (resizeMultiplier != this.state.globalResizeMultiplier) { // If a resize has occurred, scale the canvas and everything in it
            this.state.globalResizeMultiplier = resizeMultiplier
        }

        return {
            width: this.width_px_original * resizeMultiplier,
            height: this.height_px_original * resizeMultiplier
        }
    }

    handleResize = () => {
        const dims = this.getGameDimensions()
        this.setState({
            width_px : dims.width,
            height_px : dims.height,
        })
    }

    render() {
        // Return a span that is resized to the chosedn size based off handleResize(). It contains the game canvas, and any additional
        // overlays. All elements are fixed relative to this outer span. As such, when it is resized the child elements are too. The exception
        // (sort of) is the canvas. Whilst the width and height of it are resized automatically as a child, the contents are not. This must be
        // done using the style width/height properties, which are also directly updates by the relevant state.
        return (
            <span className="game-canvas" style={{width: this.state.width_px, height: this.state.height_px}}>
                <canvas id="gameCanvas" className="game-canvas" style={{width: this.state.width_px + "px", height:this.state.height_px + "px"}}/> 
                { this.state.gameState != "active" &&
                    <EndGameModal gameState={this.state.gameState} scale={this.state.globalResizeMultiplier} playerConfig={this.props.players} playerState={this.state.playerState} returnToMainMenuFn={this.props.returnToMainMenuFn}/>
                }
            </span>
        )
    }
}