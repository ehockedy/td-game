import { Button } from "../components/ui_common/display_box.js"


export class SimulationMainView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {
        return <div>
            <Button
                onClick={() => props.onClick()}
                content="Begin simulations"
                classNames="button-main-menu"
            ></Button>
        </div>
    }
}