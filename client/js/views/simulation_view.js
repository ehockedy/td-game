import React from "react";
import * as JSC from "jscharting";
import { Button } from "../components/ui_common/display_box.js"
import { LoadingBar } from "../components/ui_common/loadingBar.js"
import { SimulationRender} from "./simulation_renderer.js"
import { SpriteHandler } from "../sprite_handler.js"
import "../../css/simulation_view.css"

function TestParameterList({selectedParameters, handleParameterSelect, type}) {
    return (<span className="holder simulation-view-parameter">
        <h2 className="simulation-view-subtitle">{`${type == 'tower' ? 'Tower' : 'Upgrade'} purchase methods:`}</h2>
        {Object.keys(selectedParameters).map((method) =>
            <span key={method} className="noselect simulation-view-parameter-input">
                <input
                    className="simulation-view-parameter-checkbox"
                    type="checkbox"
                    id={method}
                    name={method}
                    checked={selectedParameters[method]}
                    onChange={(event) => {handleParameterSelect(event, type)}}
                ></input>
                <label className="simulation-view-parameter-label" htmlFor={method}>{method}</label>
            </span>
        )}
    </span>)
}

export class SimulationView extends React.Component {
    constructor(props) {
        super(props)

        // This holds the PIXI application and all the sprites
        this.spriteHandler = new SpriteHandler(this.props.config.APP_WIDTH, this.props.config.APP_HEIGHT, 0.7)

        this.state = {
            // These are the tower purchase methods copied from the simulation code server side
            selectedTowerPurchaseMethods: {
                'mostExpensive': false,
                'mostExpensiveEveryOtherRound': false,
                'random': false,
                'randomEveryOtherRound': false,
                'mostRecentlyUnlockedMaxThree': false,
                'mostRecentlyUnlockedMaxFour': false,
                'mostRecentlyUnlockedMaxFive': false,
                'mostRecentlyUnlockedMaxTwoMidRound': false,
                'mostRecentlyUnlockedMaxThreeMidRound': false,
                'mostRecentlyUnlockedMaxFourMidRound': true,
                'mostRecentlyUnlockedMaxFiveMidRound': false,
                'mostRecentlyUnlockedMaxFourMidRoundWithLimits': true
            },
            selectedUpgradePurchaseMethods: {
                'none': false,
                'buyOneCheapestBeforeTowers': false,
                'buyOneCheapestAfterTowers': false,
                'buyAllCheapestToHighestBeforeTowers': false,
                'buyAllCheapestToHighestAfterTowers': true,
            },
            seed: '5656',
            runs: 8,
            displayMode: "emptyView", // This state is only used by the client
            simulationInProgress: false,
            simulationsCompleted: 0,
            simulationsToComplete: 0,
        }

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleTowerMethodSelect = this.handleTowerMethodSelect.bind(this);

        // Add socket event to register a completed simulation
        this.props.socket.on("client/simulation/simulation_complete", () => {
            this.setState({
                simulationsCompleted: Math.min(this.state.simulationsCompleted + 1, this.state.simulationsToComplete)
            })
        })
    }

    handleTowerMethodSelect(event, parameterType) {
        const target = event.target;
        const name = target.name;
        const value = target.checked;
        this.setState((previousState) => {
            if (parameterType == 'tower') {
                previousState.selectedTowerPurchaseMethods[name] = value;
            } else if (parameterType == 'upgrade') {
                previousState.selectedUpgradePurchaseMethods[name] = value;
            }
            return previousState;
        })
    }

    handleInputChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    cleanUpExistingState() {
        // Used to ensure exsting canvas or graph are rmoved before adding another
        if (this.chart) this.chart.dispose()
        this.setState({simulationsCompleted: 0})
    }

    beginRenderingSimulation() {
        if (this.state.simulationInProgress) return
        this.cleanUpExistingState()

        // View is the scene that user is currently on
        this.view = new SimulationRender(this.props.socket, this.spriteHandler, this.props.config, this.props.enemyConfig, this.props.bulletConfig)
        this.view.loadData().then(()=>{
            this.view.startRendering()
            this.props.socket.emit("server/simulation/visualise", this.state, () => {
                this.setState({simulationInProgress: false})
            });
            this.setState({displayMode: "simulationView", simulationInProgress: true})
        })
    }

    generateGraph(results) {
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

            // Tooltip config for the tool tip as a whole
            // Specify that want to combine all points for a given x-value
            defaultTooltip: {
                combined: true,
                label_text: '<b>Round %xValue</b><hr>%points'
            },

            // Config to apply to each series
            defaultSeries: {
                defaultPoint_tooltip: '<b>%seriesName:</b> {%yValue:n0}  %icon  %towersBought | %upgradesBought',
                events: {
                    legendEntryClick: function() {
                        // No series is in focus, or different series has been chosen to be in focus
                        // therefore all the average series are currently visible.
                        // Want to make them all disappear and show only the lines that make up the
                        // this series.
                        if (chart.focussedSeriesName != this.userOptions.name) {
                            chart.series(s => s.userOptions.id === this.userOptions.id).options({visible: true})
                            chart.series(s => s.userOptions.id !== this.userOptions.id).options({visible: false})
                            chart.focussedSeriesName = this.userOptions.name
                        // If this series is clicked on but is already the focus, then restore all the
                        // average lines to be visible.
                        } else {
                            chart.series(s => s.userOptions.isAvgLine).options({visible: true})
                            chart.series(s => !s.userOptions.isAvgLine).options({visible: false})
                            chart.focussedSeriesName = undefined
                        }

                        // return false to disable default behaviour of hiding clicked series
                        return false
                    }
                  }
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

        // Additional custom chart properties
        chart.focussedSeriesName = undefined

        // Generate the data points
        let colourPaletteIdx = 0
        for (let towerPurchaseMethod in results) {
            const towerPurchaseMethodColour = JSC.getPalette("default")[colourPaletteIdx]

            // Create an array that stores the total number of lives for each round across all the runs
            let livesSums = new Array( results[towerPurchaseMethod][0].livesRemaining.length).fill(0);

            // Iterate over each run and each round in that run and record a point on the graph
            results[towerPurchaseMethod].forEach((run, idx) => {
                let graphPoints = []
                for (let i = 0; i < run.livesRemaining.length; i++) {
                    graphPoints.push({
                        'x': i,  // round
                        'y': run.livesRemaining[i],  // lives
                        attributes: [
                            ['towersBought', run.towersBought[i]],
                            ['upgradesBought', run.upgradesBought[i]]
                        ]
                    })
                    livesSums[i] += run.livesRemaining[i]  // add to the total so avg can be calclulated
                }

                // Record the points as greyed out, non-interactable point to show the distribution
                chart.series.add({
                    name: towerPurchaseMethod + '-' + idx.toString(),
                    id: towerPurchaseMethod,
                    points: graphPoints,
                    legendEntry_visible: false,
                    color: towerPurchaseMethodColour,
                    opacity: 0.2,
                    isAvgLine: false,  // custom attribute to determine if this is a main line
                    // todo make colour slightly greyed-out version of main colour https://jscharting.com/tutorials/types/js-series-point-colors-chart/#color-adjustment-settings
                })
            })
            // Divide each value by the total number of runs for that tower buying type
            let livesSumsAvg = livesSums.map((totalLivesCount, idx) => {
                return {
                    'x': idx,
                    'y': totalLivesCount/results[towerPurchaseMethod].length,
                    attributes: [
                        ['towersBought', '-'],
                        ['upgradesBought', '-'],
                    ]
                }
            })

            // Add the average line through all the runs for this tower purchasing method
            chart.series.add({
                name: towerPurchaseMethod,
                id: towerPurchaseMethod,
                points: livesSumsAvg,
                color: towerPurchaseMethodColour,
                isAvgLine: true  // custom attribute to determine if this is a main line
            })
            colourPaletteIdx += 1
        }

        // Make the non-average lines invisible
        // TODO find out why directly setting this attribute on creation causes errors
        chart.series(s => !s.userOptions.isAvgLine).options({visible: false})
        return chart
    }

    startSimulationWaitForResult() {
        this.cleanUpExistingState()
        this.setState({displayMode: "loadingView"})

        // Count how many simulations we are expecting to complete
        const towerPurchaseVariants = Object.values(this.state.selectedTowerPurchaseMethods).reduce((acc, isSelected) => isSelected ? ++acc : acc, 0)
        const upgradePurchaseVariants = Object.values(this.state.selectedUpgradePurchaseMethods).reduce((acc, isSelected) => isSelected ? ++acc : acc, 0)
        const simsToDo = towerPurchaseVariants * upgradePurchaseVariants * parseInt(this.state.runs)
        this.setState({simulationsToComplete: simsToDo})

        // Send command to server to start the simulations
        this.props.socket.emit("server/simulation/start", this.state, (response) => {
            this.setState({displayMode: "graphView"})
            this.chart = this.generateGraph(response.results)
        });
    }

    updatePixiCnt = (element) => {
        // the element is the DOM object that we will use as container to add pixi stage(canvas)
        this.pixi_cnt = element;
        //now we are adding the application to the DOM element which we got from the Ref.
        if(this.pixi_cnt && this.pixi_cnt.children.length<=0) {
            let canvas = this.spriteHandler.getCanvas();
            canvas.id = "game-canvas"
            canvas.classList.add("game-canvas-simulation")
            canvas.classList.add("display-box-shadowless")
            canvas.style.width = `${this.props.config.APP_WIDTH*0.7}px`
            canvas.style.height = `${this.props.config.APP_HEIGHT*0.7}px`
            this.pixi_cnt.appendChild(canvas)
        }
     };

    render() {
        return (
            <div> 
                {
                    <div className="noselect">
                        <h1 className="simulation-view-title">Simulator</h1>
                        <div className="simulation-view-simulation-options">
                            <span className="holder simulation-view-seed">
                                <h2 className="simulation-view-subtitle">Seed:</h2>
                                <input
                                    className="display-box noselect simulation-view-seed-input"
                                    type="text"
                                    maxLength="5"
                                    spellCheck="false"
                                    name="seed"
                                    value={this.state.seed}
                                    onChange={this.handleInputChange}
                                ></input>
                            </span>
                            <span className="holder simulation-view-runs">
                                <h2 className="simulation-view-subtitle">Runs:</h2>
                                <input
                                    // Use same class so inheret same style as seed input
                                    className="display-box noselect simulation-view-seed-input"
                                    type="number"
                                    maxLength="2"
                                    spellCheck="false"
                                    name="runs"
                                    value={this.state.runs}
                                    onChange={this.handleInputChange}
                                ></input>
                            </span>
                            {/* <span className="holder simulation-view-tower-method">
                                <h2 className="simulation-view-subtitle">Tower purchase methods:</h2>
                                {Object.keys(this.state.selectedTowerPurchaseMethods).map((method) =>
                                    <span key={method} className="noselect simulation-view-tower-method-input">
                                        <input
                                            className="simulation-view-tower-method-checkbox"
                                            type="checkbox"
                                            id={method}
                                            name={method}
                                            checked={this.state.selectedTowerPurchaseMethods[method]}
                                            onChange={this.handleTowerMethodSelect}
                                        ></input>
                                        <label className="simulation-view-tower-method-label" htmlFor={method}>{method}</label>
                                    </span>
                                )}
                            </span> */}
                            <TestParameterList selectedParameters={this.state.selectedTowerPurchaseMethods} handleParameterSelect={this.handleTowerMethodSelect} type={'tower'}/>
                            <TestParameterList selectedParameters={this.state.selectedUpgradePurchaseMethods} handleParameterSelect={this.handleTowerMethodSelect} type={'upgrade'}/>
                            <span className="holder simulation-view-buttons">
                                <h2 className="simulation-view-subtitle">Start simulation:</h2>
                                <Button
                                    onClick={() => {this.beginRenderingSimulation()}}
                                    content="Watch live"
                                    classNames="simulation-view-button"
                                ></Button>
                                <Button
                                    onClick={() => {this.startSimulationWaitForResult()}}
                                    content="Create graph"
                                    classNames="simulation-view-button"
                                ></Button>
                            </span>
                        </div>
                        <br/><br/>
                        { this.state.displayMode == "simulationView" ?
                            <div ref={this.updatePixiCnt}></div>
                        : this.state.displayMode == "loadingView" ?
                            <LoadingBar width="400px" style={{display: "flex", justifyContent: "center"}} completed={`${this.state.simulationsCompleted/this.state.simulationsToComplete*100}`}></LoadingBar>
                        : this.state.displayMode == "graphView" ?
                            <div id="chartDiv" className="noselect display-box" style={{width: "80vw", height: "70vh", margin: '0px auto'}}></div>
                        : null
                        }
                    </div>
                }
            </div>
        )
    }
}