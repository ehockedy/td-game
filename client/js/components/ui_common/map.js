import { SpriteHandler } from "../../sprite_handler.js"
import { MapComponent } from "../game/map.js"
import "../../../css/game.css"

class GameMap extends React.Component {
    constructor(props, width, height) {
        super(props)
        this.spriteHandler = new SpriteHandler(width, height)
        this.pixi_container_classes = ""
    }

    // Ref: https://medium.com/@peeyush.pathak18/pixijs-with-react-3cd40738180
    updatePixiContainer = (element) => {
        // the element is the DOM object that we will use as container to add pixi stage(canvas)
        this.pixi_cnt = element;
        //now we are adding the application to the DOM element which we got from the Ref.
        if(this.pixi_cnt && this.pixi_cnt.children.length<=0) {
            let canvas = this.spriteHandler.getCanvas()
            canvas.classList.add(this.pixi_container_classes)
            this.pixi_cnt.appendChild(canvas);
        }
    };


}

// Used as the background for the main menu and lobby
export class GameMapBackground extends GameMap {
    constructor(props) {
        const width = screen.width + props.mapSpriteSize
        const height = screen.height + props.mapSpriteSize

        const cols = Math.floor(width / props.mapSpriteSize)
        const rows = Math.floor(height / props.mapSpriteSize)

        super(props, width, height)

        this.pixi_container_classes = "pixi-bg"

        let grid = []  // 2d array that stores the row and column values
        // Adjust number of rows based on screen size.
        // TODO a few cases to address in the future:
        // - mobile browser does not seem to fill the screen
        // - if zoomed out, does not fill the screen

        for (let row=0; row < rows; row++) {
            grid.push(new Array(cols).fill({"value":'x'}));
        };
        let map = new MapComponent(props.mapSpriteSize)
        map.constructMap(grid)
        this.spriteHandler.registerDynamicContainer(map)
    }

    render() {
        return (
            <div ref={this.updatePixiContainer} className="pixi-bg-container"></div>
        )
    }
}

// Used in the lobby to let players select the map they want to use
export class GameMapSelection extends GameMap {
    constructor(props) {
        super(props, props.width, props.height)

        this.pixi_container_classes = "map-select"

        this.map = new MapComponent(props.mapSpriteSize)
        this.spriteHandler.registerContainer(this.map)
    }

    // When the map stored in the root component has changed, update the displayed map
    componentDidUpdate(prevProps) {
        if (prevProps.mapStructure != this.props.mapStructure) {
            this.map.constructMap(this.props.mapStructure)
        }
    }

    render() {
        return (
            <span ref={this.updatePixiContainer}></span>
        )
    }
}