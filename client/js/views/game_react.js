import React from "react";
import { GameRenderer} from "./game.js"
import { SpriteHandler } from "../sprite_handler.js"
import "../../css/game.css"

export class Game extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}

        let clientConfig = this.props.config

        // This holds the PIXI application and all the sprites
        this.spriteHandler = new SpriteHandler(clientConfig.APP_WIDTH, clientConfig.APP_HEIGHT)

        // View is the scene that user is currently on
        this.view = new GameRenderer(this.props.socket, this.spriteHandler, clientConfig, this.props.thisPlayer, this.props.players, this.props.gameSettings)
        this.view.loadAssets().then(()=>{
            this.view.startRendering()
        })
    }
    updatePixiCnt = (element) => {
        // the element is the DOM object that we will use as container to add pixi stage(canvas)
        this.pixi_cnt = element;
        //now we are adding the application to the DOM element which we got from the Ref.
        if(this.pixi_cnt && this.pixi_cnt.children.length<=0) {
            let canvas = this.spriteHandler.getCanvas();
            canvas.classList.add("game-canvas")
            canvas.classList.add("display-box-shadowless")
            this.pixi_cnt.appendChild(canvas)
        }
     };

    render() {
        return (
            <div ref={this.updatePixiCnt}></div>
        )
    }
}