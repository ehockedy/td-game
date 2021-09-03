import React from 'react';
import { ColourPicker } from "./colourPicker.js"
import "../../../css/common.css"
import "../../../css/lobby.css"

export function NamePlace(props) {
    return <div className="name-place-user">
            <input
                className="name-place name-place-colour-active slanted display-box noselect"
                type="text"
                maxLength="10"
                value={props.text}
                spellCheck="false"
                onChange={(event) => {props.onChange(event.target.value.toUpperCase())}}
                disabled={!props.enabled}
                style={{backgroundColor: props.colour}}
            ></input>
            <ColourPicker
                onChange={props.onColourChange}
            ></ColourPicker>
        </div>
}

export function NamePlaceEmpty(props) {
    return <div className="name-place name-place-colour-waiting slanted display-box noselect">
        <span className="name-place-text-waiting">{props.initialValue}</span>
    </div>
}