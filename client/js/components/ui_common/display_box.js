import "../../../css/common.css"

export function Button(props) {
    return <button className={"display-box button noselect slanted " + props.classNames}
        onClick={props.onClick}>
        <span>{props.content}</span>
    </button>
}
