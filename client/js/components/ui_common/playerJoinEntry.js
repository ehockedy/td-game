import React from 'react';
import "../../../css/common.css"
import "../../../css/lobby.css"

export function NamePlace(props) {
    return <input
                className="namePlace slanted-backwards display-box noselect"
                type="text"
                maxLength="10"
                value={props.initialValue}//{props.text}
                spellCheck="false"
                onChange={(event) => {props.onChange(event.target.value)}}
            />
}

export function NamePlaceEmpty(props) {
    return <div className="namePlaceEmpty slanted-backwards display-box noselect">
        <span className="namePlaceEmptyText">{props.initialValue}</span>
    </div>
}