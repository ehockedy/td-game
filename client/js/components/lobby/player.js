import { TextRect } from "../ui_common/textRect.js"

export class Player extends PIXI.Container {
    constructor(index, width_px, height_px, x, y, anchorX, anchorY) {
        super()

        this.index = index
        this.x = x
        this.y = y

        this.xLocal = -width_px * anchorX
        this.yLocal = -height_px * anchorY

        this.noPlayerPlaceholder = new TextRect(width_px, height_px, 0, 0, this.index, 40, 0x999999, anchorX, anchorY)
        this.addChild(this.noPlayerPlaceholder)
    }

    setPlayer(playerData) {
        this.playerInfoContainer = new PIXI.Container()
        this.addChild(this.playerInfoContainer)

        this.noPlayerPlaceholder.visible = false

        let titleStyle = {
            align: 'left',
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'bold'
        }
        let title = new PIXI.Text("Player " + this.index.toString(), titleStyle);
        title.x = this.xLocal + 5
        title.y = this.yLocal + 5
        this.playerInfoContainer.addChild(title)

        let nameStyle = {
            align: 'left',
            fontFamily: 'Arial',
            fontSize: 18,
            fontWeight: 'bold'
        }
        let name = new PIXI.Text(" Name:", nameStyle);
        name.x = this.xLocal + 5
        name.y = this.yLocal + 30
        this.playerInfoContainer.addChild(name)

        let nameValueStyle = {
            align: 'left',
            fontFamily: 'Arial',
            fontSize: 18
        }
        let nameValue = new PIXI.Text(" " + playerData.playerID, nameValueStyle);
        nameValue.x = this.xLocal + 5
        nameValue.y = this.yLocal + 50
        this.playerInfoContainer.addChild(nameValue)
    }

    clearPlayer() {
        this.noPlayerPlaceholder.visible = true
        this.removeChild(this.playerInfoContainer)
    }
}
