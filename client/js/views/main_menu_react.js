import { Button } from "../components/ui_common/display_box.js"
import "../../css/main_menu.css"
import "../../css/common.css"

function MenuOption(props) {
    return (
        <Button
            onClick={() => props.onClick()}
            content={props.text}
            classNames="button-main-menu"
        ></Button>
    )
}

function TextBoxForm(props) {
    return (
        <form className="noselect join-game-form" onSubmit={props.onSubmit}>
            <span className="join-game-title">Enter game code:</span>
            <input className="join-game-input slanted display-box" type="text" maxLength="4" value={props.text} spellCheck="false" onChange={(event) => {props.onChange(event.target.value)}} />
            <span className="join-game-button-container slanted">
                <input className="join-game-button button-inline join-game-button-green display-box" type="submit" value="Submit" />
                <button className="join-game-button button-inline join-game-button-red display-box" type="button" onClick={props.onClose}>
                    Cancel
                </button>
            </span>
            <br/><br/>
            <div>{props.responseMessage}</div>
        </form>
    )
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
            <div className="noselect main-menu">
                <img className="main-menu-logo noselect main-menu-logo-bounce" src="client/assets/logo/logo.png"></img>

                <div className="main-menu-options noselect">
                    {
                        !this.state.joinGameTextBoxVisible ?

                        <div>
                            <MenuOption text="Start Game" leftPos="33" topPos="66"
                                onClick={() => {
                                    this.props.socket.emit("server/session/start", (gameID) => {
                                        this.props.setGameIDHandler(gameID)
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
                        :
                        <TextBoxForm
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
                                        this.props.socket.emit("server/session/join", { "gameID": this.state.joinGameText }, (gameID) => {
                                            this.props.setGameIDHandler(gameID)
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
                        ></TextBoxForm>
                    }
                </div>
            </div>
        )
    }
}

