import React from "react";
import * as JSC from "jscharting";
import { Button } from "../components/ui_common/display_box.js"
import { SimulationRender} from "./simulation_renderer.js"
import { SpriteHandler } from "../sprite_handler.js"
import "../../css/simulation_view.css"

//JSC.defaults({ baseUrl: '' });

export class SimulationView extends React.Component {
    constructor(props) {
        super(props)
        this.displayMode = "menu"  // "simulationView", "simulationResults"
        this.state = {}

        // This holds the PIXI application and all the sprites
        this.spriteHandler = new SpriteHandler(this.props.config.APP_WIDTH, this.props.config.APP_HEIGHT)
    }
    
    beginRenderingSimulation() {
        // View is the scene that user is currently on
        this.view = new SimulationRender(this.props.socket, this.spriteHandler, this.props.config)
        this.view.loadAssets().then(()=>{
            this.view.startRendering()
            this.displayMode = "simulationView"
            this.props.socket.emit("server/simulation/visualise"); 
        })
    }

    startSimulationWaitForResult() {
        this.props.socket.emit("server/simulation/start", (response) => {
            // Set up the graph
            let chart = JSC.Chart("chartDiv", {
                // debug: true,
                yAxis: {
                    alternateGridFill: 'none',
                    defaultTick_label_text: '%value',
                    scale_range: [0, 100]
                },
                xAxis: {
                    crosshair_enabled: true,
                    scale : {
                        interval: 1,
                        minInterval: 1
                    }
                },
                palette: ['#eeeeee'],

                // Tooltip config for the tool tip as a whole
                // Specify that want to combine all points for a given x-value
                defaultTooltip: {
                    combined: true,
                    label_text: '<b>Round %xValue</b><hr> %points'
                },

                // Config to apply to each series
                defaultSeries: {
                    defaultPoint_tooltip: '<b>%seriesName:</b> %yValue %icon'
                },

                // Content applied to each point
                defaultPoint: {
                    marker: {
                        type: 'circle'
                    }
                },

                legend: {
                    template: '%icon %name'
                },

                // Set the look of the box the grid sits in
                box: {
                    padding: 10
                }

            });

            // Generate the data points
            const results = response.results
            for (let towerPurchaseMethod in results) {
                // Create an array that stores the total number of lives for each round across all the runs
                let livesSums = new Array( results[towerPurchaseMethod][0].livesRemaining.length).fill(0);

                // Iterate over each run and each round in that run and record a point on the graph
                results[towerPurchaseMethod].forEach((run, idx) => {
                    let graphPoints = []
                    for (let i = 0; i < run.livesRemaining.length; i++) {
                        graphPoints.push({
                            'x': i,  // round
                            'y': run.livesRemaining[i]  // lives
                        })
                        livesSums[i] += run.livesRemaining[i]  // add to the total so avg can be calclulated
                    }

                    // Record the points as greyed out, non-interactable point to show the distribution
                    chart.series.add({
                        name: towerPurchaseMethod + '-' + idx.toString(),
                        points: graphPoints,
                        mouseTracking_enabled: false  // Ignore hovering over non-averaged points
                        // todo make colour slightly greyed-out version of main colour https://jscharting.com/tutorials/types/js-series-point-colors-chart/#color-adjustment-settings
                    })
                })
                // Divide each value by the total number of runs for that tower buying type
                let livesSumsAvg = livesSums.map((totalLivesCount, idx) => { return [idx, totalLivesCount/results[towerPurchaseMethod].length ]})

                // Add the average line through all the runs for this tower purchasing method
                chart.series.add({
                    name: towerPurchaseMethod,
                    points: livesSumsAvg,
                    color: 'royalblue',
                })
            }
        });
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
                    this.displayMode == "menu" ?
                        <div>
                            <Button
                                onClick={() => {this.beginRenderingSimulation()}}
                                content="Watch simulations live"
                                classNames="button-simulation-view"
                            ></Button>
                            <Button
                                onClick={() => {this.startSimulationWaitForResult()}}
                                content="Run simulations, display results"
                                classNames="button-simulation-view"
                            ></Button>
                            <br/><br/>
                            <div id="chartDiv" style={{width: "80vw", height: "70vh", margin: '0px auto'}}></div>
                        </div>
                    : this.displayMode == "simulationView" ?
                        <div ref={this.updatePixiCnt}></div>
                    : null
                }
            </div>
        )
    }
}