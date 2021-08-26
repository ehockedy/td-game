import React from 'react';
import "../../../css/common.css"
import "../../../css/lobby.css"

export function NamePlace(props) {
    return <input
                className="name-place name-place-colour-active slanted display-box noselect"
                type="text"
                maxLength="10"
                value={props.text}
                spellCheck="false"
                onChange={(event) => {props.onChange(event.target.value.toUpperCase())}}
                disabled={!props.enabled}
            />
}

export function NamePlaceEmpty(props) {
    return <div className="name-place name-place-colour-waiting slanted display-box noselect">
        <span className="name-place-text-waiting">{props.initialValue}</span>
    </div>
}