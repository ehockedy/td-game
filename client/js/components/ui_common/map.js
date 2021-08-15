import { SpriteHandler } from "../../sprite_handler.js"
import { MapComponent } from "../game/map.js"
import "../../../css/game.css"

export class GameMap extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
        const mapSpriteSize = props.mapSpriteSize

        let grid = []  // 2d array that stores the row and column values
        // Adjust number of rows based on screen size.
        // TODO a few cases to address in the future:
        // - mobile browser does not seem to fill the screen
        // - if zoomed out, does not fill the screen
        const rows = Math.floor(screen.height / mapSpriteSize) + 2  // Add 2 so bit of a buffer when generating the map
        const cols = Math.floor(screen.availWidth / mapSpriteSize) + 2
        for (let row=0; row < rows; row++) {
            grid.push(new Array(cols).fill({"value":'x'}));
        };
        this.spriteHandler = new SpriteHandler(grid[0].length * mapSpriteSize, grid.length * mapSpriteSize)
        let map = new MapComponent(mapSpriteSize)
        map.constructMap(grid)
        this.spriteHandler.registerDynamicContainer(map, map.menuBackgroundAnimationTick)
    }

    // Ref: https://medium.com/@peeyush.pathak18/pixijs-with-react-3cd40738180
    updatePixiCnt= (element) => {
        // the element is the DOM object that we will use as container to add pixi stage(canvas)
        this.pixi_cnt = element;
        //now we are adding the application to the DOM element which we got from the Ref.
        if(this.pixi_cnt && this.pixi_cnt.children.length<=0) {
           this.pixi_cnt.appendChild(this.spriteHandler.getCanvas());
           this.pixi_cnt.classList.add("pixi-bg");
        }
     };

    render() {
        return (
            <div ref={this.updatePixiCnt} className="pixi-bg-container"></div>
        )
    }
}