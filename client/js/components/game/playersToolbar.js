import { BaseToolbarComponent } from "./base/baseToolbarComponent.js";
import { KeyValueInfo } from "../ui_common/keyValueInfo.js"

export class PlayersToolbar extends BaseToolbarComponent {
    constructor(width_px, height_px, x, y) {
        super("playerinfo", width_px, height_px, x, y)

        this.playerSpaceWidth = width_px * 0.75
        this.playersContainer = new PIXI.Container()
        this.addChild(this.playersContainer)
    }

    addPlayer(info) {
        if (!this.playersContainer.getChildByName(info.playerID)) {
            let numberMargin = 20
            let infoWidth = this.playerSpaceWidth / 4
            let playerIndex = this.playersContainer.children.length

            let numberPosition = infoWidth * playerIndex + numberMargin/2
            let playerInfoPosition = numberPosition + numberMargin/2

            let positionNumber = this.getLeaderBoardPosition(playerIndex + 1)
            positionNumber.x = numberPosition
            positionNumber.y = this.height_px/2
            this.addChild(positionNumber)

            let playerInfoContainerWidth = infoWidth - numberMargin
            let playerInfoContainer = this.renderPlayerInfo(info, playerInfoContainerWidth)
            playerInfoContainer.x = playerInfoPosition
            this.playersContainer.addChild(playerInfoContainer)
        }
    }

    getLeaderBoardPosition(position) {
        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold'
        }

        let positionNumber = new PIXI.Text(position, defaultStyle);
        positionNumber.anchor.set(0.5)
        return positionNumber
    }

    renderPlayerInfo(playerInfo, width) {
        let localContainer = new PIXI.Container()
        localContainer.name = playerInfo.playerID

        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold'
        }

        // Title
        let text = new PIXI.Text(playerInfo.playerID, defaultStyle);
        text.x = width/2
        text.y = 10
        text.anchor.set(0.5)
        localContainer.addChild(text);


        // Points
        let xMargin = 5
        let points = new KeyValueInfo("Points", 0, width, xMargin, 16)
        points.name = "points"
        points.y = Math.floor(40)
        localContainer.addChild(points);


        // Ready icon
        let readyIconStyle = {
            fill: "0x22FF33",
            fontFamily: 'Arial',
            fontSize: 16,
            fontWeight: 'bold',
        }
        let readyIcon = new PIXI.Text("\u{1F5F8}", readyIconStyle);
        readyIcon.x = 0
        readyIcon.y = 0
        readyIcon.anchor.set(0)
        readyIcon.name = "readyIcon"
        readyIcon.visible = false
        localContainer.addChild(readyIcon)

        return localContainer
    }

    setPlayerReady(playerID) {
        this._setReadiness(playerID, true)
    }

    unsetPlayerReady() {
        this._setReadiness(playerID, false)
    }

    unsetAllPlayers() {
        // TODO this could be done more nicely
        this.children.forEach((child) => {
            let readyIcon = child.getChildByName("readyIcon")
            if (readyIcon) readyIcon.visible = false
        })
    }

    _setReadiness(playerID, readiness) {
        let playerInfoContainer = this.playersContainer.getChildByName(playerID)
        if (playerInfoContainer) {
            playerInfoContainer.getChildByName("readyIcon").visible = readiness
        }
    }

    update(playersData) {
        playersData.objects.forEach((player) => {
            let playerInfo = this.playersContainer.getChildByName(player.playerID)
            if (playerInfo != undefined) {
                playerInfo.getChildByName("points").setValue(player.stats["points"])
            }
        })
    }
}
