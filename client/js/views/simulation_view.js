import React from "react";
import { Button } from "../components/ui_common/display_box.js"
import { SimulationRender} from "./simulation_renderer.js"
import { SpriteHandler } from "../sprite_handler.js"
import "../../css/game.css"

export class SimulationView extends React.Component {
    constructor(props) {
        super(props)
        this.simulationStarted = false
        this.state = {}

        // This holds the PIXI application and all the sprites
        this.spriteHandler = new SpriteHandler(this.props.config.APP_WIDTH, this.props.config.APP_HEIGHT)
    }
    
    beginRenderingSimulation() {
        // View is the scene that user is currently on
        this.view = new SimulationRender(this.props.socket, this.spriteHandler, this.props.config)
        this.view.loadAssets().then(()=>{
            this.view.startRendering()
            this.simulationStarted = true
            this.props.socket.emit("server/simulation/start"); 
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
            <div> 
                {
                    !this.simulationStarted ? <Button
                        onClick={() => {this.beginRenderingSimulation()}}
                        content="Begin simulations"
                        classNames="button-main-menu"
                    ></Button> :
                    <div ref={this.updatePixiCnt}></div>
                }
            </div>
        )
    }
}