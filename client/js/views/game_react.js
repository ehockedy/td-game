import React from "react";
import { GameRenderer} from "./game.js"
import { SpriteHandler } from "../sprite_handler.js"
import { generateClientConfig } from "../constants.js"

export class Game extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}

        let clientConfig = generateClientConfig(this.props.config)

        // This holds the PIXI application and all the sprites
        let spriteHandler = new SpriteHandler(clientConfig.APP_WIDTH, clientConfig.APP_HEIGHT)

        // View is the scene that user is currently on
        this.view = new GameRenderer(this.props.socket, spriteHandler, clientConfig, this.props.thisPlayer)
        this.view.loadAssets().then(()=>{
            this.view.startRendering()
        })
    }

    render() {
        return (
            <div></div>
        )
    }
}