import React from "react"
import  "../../../css/loadingBar.css"
import  "../../../css/common.css"

export function LoadingBar(props) {
    return (
        <div style={props.style}>
            <div>
                <h2 style={{margin: "5px"}}>Loading:</h2>
                <div style={{width: props.width}} className="loading-bar loading-bar-container display-box slanted">
                    <div style={{width: `${props.completed}%` }} className="loading-bar loading-bar-bar"></div>
                </div>
            </div>
        </div>
    )
}