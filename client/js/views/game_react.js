import React from "react";
import { GameRenderer} from "./game.js"
import { SpriteHandler } from "../sprite_handler.js"
import { EndGameScreen } from "../components/game/endScreens/endGameModal.js"
import "../../css/game.css"

export class Game extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            gameState : "active",
            playerState: [
            //     {
            //     id: 'test1',
            //     points: 123234,
            //     money: 234
            // },
            // {
            //     id: 'test2',
            //     points: 555,
            //     money: 55
            // },{
            //     id: 'test3',
            //     points: 123234,
            //     money: 234
            // },
            // {
            //     id: 'test4',
            //     points: 555,
            //     money: 55
            // }
            ],  // Holds game info such as money and score, is not updated regularly though - only when gameState
            width_px: this.props.config.APP_WIDTH,
            height_px: this.props.config.APP_HEIGHT,
            globalResizeMultiplier: 1,
            isFullscreen: false,
        }
        this.width_px_original = this.props.config.APP_WIDTH
        this.height_px_original = this.props.config.APP_HEIGHT
        this.margin = 24 // in px
        this.resizeFactor = 1  // todo pass in via props

        this.gameContainerRef = React.createRef(null)
        this.menuRef = React.createRef(null)
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
        const spriteHandler = new SpriteHandler(clientConfig.APP_WIDTH, clientConfig.APP_HEIGHT, 1, gameCanvas, true)

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
        window.addEventListener("fullscreenchange", () => {
            this.setState({isFullscreen: !!document.fullscreenElement})
        });

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
        const windowHeight = Math.min(window.outerHeight, window.innerHeight) - (this.menuRef?.current?.clientHeight || 0);
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

    toggleFullscreen = (elem) => {
        if (this.state.isFullscreen && !!document.fullscreenElement) {
            document
            .exitFullscreen()
            .then(() => this.setState({isFullscreen: false}))
            return
        }

        let fullscreenRequest
        if (elem?.requestFullscreen) {
            fullscreenRequest = elem.requestFullscreen();
        } else if (elem?.webkitRequestFullscreen) { /* Safari */
            fullscreenRequest = elem.webkitRequestFullscreen();
        } else if (elem?.msRequestFullscreen) { /* IE11 */
            fullscreenRequest = elem.msRequestFullscreen();
        }

        // If success, update state
        fullscreenRequest?.then(() => this.setState({isFullscreen: true}))
    }

    render() {
        // Return a span that is resized to the chosedn size based off handleResize(). It contains the game canvas, and any additional
        // overlays. All elements are fixed relative to this outer span. As such, when it is resized the child elements are too. The exception
        // (sort of) is the canvas. Whilst the width and height of it are resized automatically as a child, the contents are not. This must be
        // done using the style width/height properties, which are also directly updates by the relevant state.
        return (
            <div className="game-canvas" ref={this.gameContainerRef} >
                <div
                    className={`game-options noselect ${this.state.isFullscreen ? 'fullscreen' : ''}`}
                    ref={this.menuRef}
                    style={{width: this.state.width_px + "px"}}
                >
                    <div className="game-options-game-code">Game code: {this.props.gameID}</div>
                    <button
                        className="game-options-fullscreen-button"
                        onClick={() => {
                            this.toggleFullscreen(this.gameContainerRef.current)
                        }}
                    >{this.state.isFullscreen ? 'Exit Fullscreen' : 'Enable Fullscreen'}</button>
                </div>
                <canvas id="gameCanvas" style={{width: this.state.width_px + "px", height:this.state.height_px + "px"}}/>
                { this.state.gameState != "active" &&
                    <EndGameScreen gameState={this.state.gameState} scale={this.state.globalResizeMultiplier} playerConfig={this.props.players} playerState={this.state.playerState} returnToMainMenuFn={this.props.returnToMainMenuFn}/>
                }
            </div>
        )
    }
}