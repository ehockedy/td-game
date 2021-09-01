import React from "react"
import  "../../../css/colourPicker.css"
import  "../../../css/common.css"

export class ColourPicker extends React.Component {
    constructor(props) {
        super(props)
        this.colours = ["#CC3344", "#44CC11", "#2244DD", "#22DDDD",
                        "#DDDD33", "#90B4A8", "#99B270", "#17EEDD"]
        this.activeColourName = "Pick a colour"

        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleMouseClick = this.handleMouseClick.bind(this);
    }

    handleMouseOver(element) {
        element.target.style.boxShadow = '0px 0px 6px 2px #000000FF';
        element.target.style.zIndex = "1"
        element.target.style.cursor = "pointer"
    }

    handleMouseLeave(element) {
        element.target.style.boxShadow = '';
        element.target.style.zIndex = "0"
    }

    handleMouseClick(colour) {
        console.log(colour)
    }

    render() {
        return (
            <span className="colour-picker-container">
                <span className="colour-picker-colour-container">
                    {this.colours.map((colour) => {
                        return <div
                        className="colour-picker-colour"
                        onMouseOver={this.handleMouseOver}
                        onMouseLeave={this.handleMouseLeave}
                        onClick={()=>{this.handleMouseClick(colour)}}
                        key={colour}
                        style={{backgroundColor:colour}}></div>
                    })}
                </span>
                <div className="colour-picker-colour-name">{this.activeColourName}</div>
            </span>
        )
    }
}