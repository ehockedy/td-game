import "../../../css/display_box.css"

export function Button(props) {
    return <button className={"display-box button noselect " + props.classNames}
        onClick={props.onClick}>
        <span>{props.content}</span>
    </button>
}
