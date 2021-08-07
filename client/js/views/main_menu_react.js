import { Button } from "../components/ui_common/display_box.js"
import "../../css/main_menu.css"

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

function MenuOption() {
    return (
        <Button
            onClick={() => this.props.onClick()}
            content={this.props.text}
            classNames="button-main-menu"
        ></Button>
    )
}


function JoinGameTextBox() {
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
            <br/><br/>
            <div>{this.props.responseMessage}</div>
        </form>
    );
}

export class MainMenu extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            joinGameText: "",
            joinGameTextBoxVisible: false,
            buttonsDisabled: false,
            responseMessage: "",
            responseMessageTimeoutFn: null,
        }
    }

    render() {
        return (
            <div>
                <Title text="Tower Defence" leftPos="50" topPos="33"></Title>

                <div className="main-menu-options">
                    <MenuOption text="Start Game" leftPos="33" topPos="66"
                        onClick={() => {
                            this.props.socket.emit("server/session/start", (gameID, playerID) => {
                                this.props.setGameIDHandler(gameID)
                                this.props.setPlayerIDHandler(playerID)
                            })
                        }}
                        disabled={this.state.buttonsDisabled}
                    ></MenuOption>
                    <br/><br/>
                    <MenuOption text="Join Game" leftPos="66" topPos="66"
                        onClick={() => {
                            this.setState({
                                joinGameTextBoxVisible : !this.state.joinGameTextBoxVisible,
                                buttonsDisabled: true,
                            })
                        }}
                        disabled={this.state.buttonsDisabled}
                    ></MenuOption>
                </div>

                <JoinGameTextBox leftPos="66" topPos="75"
                    onSubmit={(event) => {
                        event.preventDefault();  // Prevent page reloading after submit
                        this.props.socket.emit("server/session/verify", { "gameID": this.state.joinGameText }, (response) => {
                            if (response["response"] == "fail") { // Game does not exist
                                // Remove any existing timeout that may override new message output
                                if (this.state.responseMessageTimeoutFn) {
                                    clearTimeout(this.state.responseMessageTimeoutFn)
                                }

                                // Set the new message to disappear after two seconds
                                let timeoutFn = setTimeout(() => {
                                    this.setState({responseMessage: ""})
                                    this.state.responseMessageTimeoutFn = null
                                }, 2000);

                                // Display that the game code did not match an existing game
                                this.setState({
                                    responseMessage: "Game not found",
                                    responseMessageTimeoutFn: timeoutFn,
                                })
                            } else if (response["response"] == "success") { // Game exists
                                this.props.socket.emit("server/session/join", { "gameID": this.state.joinGameText }, (gameID, playerID) => {
                                    this.props.setGameIDHandler(gameID)
                                    this.props.setPlayerIDHandler(playerID)
                                })
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
                    responseMessage={this.state.responseMessage}
                ></JoinGameTextBox>
            </div>
        )
    }
}

