import { setGameID } from "../state.js"
import { randomAlphaCharString } from "../tools.js"

class Title extends React.Component {
    render() {
        return <h1 style={{
            width: "50%",  /// width of element. % is percentage of the containing block
            textAlign: "center",
            position: "absolute",  // positioned relative to nearest ancestor
            left: this.props.leftPos+ "%",  // sets position from left edge
            top: this.props.topPos + "%",  // sets position from top edge
            transform: "translate(-50%, -50%)"  // move so that is centered based on centre of element, not top left corner
        }}
        >
            {this.props.text}
        </h1>
    }
}

class MenuOption extends React.Component {
    render() {
        return <button
            style={{
                width: "20%",  /// width of element. % is percentage of the containing block
                textAlign: "center",
                position: "absolute",  // positioned relative to nearest ancestor
                left: this.props.leftPos+ "%",  // sets position from left edge
                top: this.props.topPos + "%",  // sets position from top edge
                transform: "translate(-50%, -50%)",  // move so that is centered based on centre of element, not top left corner
            }}
            onClick={() => this.props.onClick()}
        >
            {this.props.text}
        </button>
    }
}

export class MainMenu extends React.Component {
    render() {
        const gameID = randomAlphaCharString(4)
        const startGameData = {
            "gameID": gameID
        }
        setGameID(gameID)
        return (
            <div>
                <Title text="Tower Defence" leftPos="50" topPos="33"></Title>
                <MenuOption text="Start Game" leftPos="33" topPos="66" onClick={()=>{this.props.socketClient.emit("server/session/join", startGameData)}}></MenuOption>
                <MenuOption text="Join Game" leftPos="66" topPos="66"></MenuOption>
            </div>
        )
    }
}

