import { setGameID } from "../state.js"
import { randomAlphaCharString } from "../tools.js"

class Title extends React.Component {
    render() {
        return <h1 style={{
            width: "50%",  /// width of element. % is percentage of the containing block
            textAlign: "center",
            position: "absolute",  // positioned relative to nearest ancestor
            left: this.props.leftPos + "%",  // sets position from left edge
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
                left: this.props.leftPos + "%",  // sets position from left edge
                top: this.props.topPos + "%",  // sets position from top edge
                transform: "translate(-50%, -50%)",  // move so that is centered based on centre of element, not top left corner
            }}
            onClick={() => this.props.onClick()}
            disabled={this.props.disabled}
        >
            {this.props.text}
        </button>
    }
}

class JoinGameTextBox extends React.Component {
    render() {
        return (
            <form
                onSubmit={this.props.onSubmit}
                style={{
                    visibility:this.props.isVisible? "visible" : "hidden",
                    position: "absolute",  // positioned relative to nearest ancestor
                    left: this.props.leftPos + "%",  // sets position from left edge
                    top: this.props.topPos + "%",  // sets position from top edge
                    transform: "translate(-50%, -50%)",  // move so that is centered based on centre of element, not top left corner
                }}>
                <div>Enter game code below:</div>
                <label>
                    <input type="text" maxLength="4" value={this.props.text} onChange={(event) => {this.props.onChange(event.target.value)}} />
                </label>
                <input type="submit" value="Submit" />
                <button type="button" onClick={this.props.onClose}>
                    Close
                </button>

            </form>
        );
    }
}

export class MainMenu extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            joinGameText: "",
            joinGameTextBoxVisible: false,
            buttonsDisabled: false,
        }
    }

    render() {
        const gameID = randomAlphaCharString(4)
        const startGameData = {
            "gameID": gameID
        }

        setGameID(gameID)
        return (
            <div>
                <Title text="Tower Defence" leftPos="50" topPos="33"></Title>

                <MenuOption text="Start Game" leftPos="33" topPos="66"
                    onClick={() => {
                        this.props.socketClient.emit("server/session/join", startGameData)
                    }}
                    disabled={this.state.buttonsDisabled}
                ></MenuOption>

                <MenuOption text="Join Game" leftPos="66" topPos="66"
                    onClick={() => {
                        this.setState({
                            joinGameTextBoxVisible : !this.state.joinGameTextBoxVisible,
                            buttonsDisabled: true,
                        })
                    }}
                    disabled={this.state.buttonsDisabled}
                ></MenuOption>

                <JoinGameTextBox leftPos="66" topPos="75"
                    onSubmit={(event) => {
                        event.preventDefault();  // Prevent page reloading after submit
                        this.props.socketClient.emit("server/session/verify", { "gameID": this.state.joinGameText }, (response) => {
                            if (response["response"] == "fail") { // Game does not exist
                                alert("Game not found")
                                //setTimeout(() => { _this.joinGameResponseText.text = "" }, 2000);
                            } else if (response["response"] == "success") { // Game exists
                                alert("Game found")
                                //this.socket.emit("sever/session/join", { "gameID": userInput })
                                //setGameID(userInput)
                            }
                        })
                    }}
                    onClose={() => {
                        this.setState({
                            joinGameTextBoxVisible : false,
                            buttonsDisabled: false,
                            joinGameText: "",
                        })
                    }}
                    onChange={(val) => {
                        this.setState({
                            // Enforce upper case, less change of mistaking letters in game code
                            joinGameText: val.toUpperCase(),
                        })
                    }}
                    isVisible={this.state.joinGameTextBoxVisible}
                    text={this.state.joinGameText}
                ></JoinGameTextBox>
            </div>
        )
    }
}

