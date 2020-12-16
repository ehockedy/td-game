import { BaseToolbarComponent } from "./base/baseToolbarComponent.js";
import { getPositionWithinEquallySpacedObjects } from "../../tools.js"
import { KeyValueInfo } from "../ui_common/keyValueInfo.js"

export class PlayersToolbar extends BaseToolbarComponent {
    constructor(width_px, height_px, x, y) {
        super("playerinfo", width_px, height_px, x, y)

        this.yOffsetGap = 20
    }

    addPlayer(info) {
        if (!this.getChildByName(info.playerID)) {
            let playerInfoContainer = this.renderPlayerInfo(info)
            playerInfoContainer.x = getPositionWithinEquallySpacedObjects(info.index+1, 4, this.width_px/4, this.width_px) - this.width_px/4/2
            this.addChild(playerInfoContainer)
        }
    }

    renderPlayerInfo(playerInfo) {
        let localContainer = new PIXI.Container()
        localContainer.name = playerInfo.playerID

        let xMargin = 20

        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: this.width_px/4 - xMargin // TODO make 4 max players
        }

        // Title
        let text = new PIXI.Text(playerInfo.playerID, defaultStyle);
        text.x = this.width_px/4/2
        text.y = 10
        text.anchor.set(0.5)
        localContainer.addChild(text);

        let playerFields = ["points", "money"]

        let yOffset = 0
        playerFields.forEach((field) => {
            yOffset += this.yOffsetGap

            let info = new KeyValueInfo(field, 0, this.width_px/4, xMargin, 16)
            info.name = field
            info.y = Math.floor(yOffset)

            localContainer.addChild(info);
        })

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
        let playerInfoContainer = this.getChildByName(playerID)
        if (playerInfoContainer) {
            playerInfoContainer.getChildByName("readyIcon").visible = readiness
        }
    }

    update(playersData) {
        playersData.objects.forEach((player) => {
            let playerInfo = this.getChildByName(player.playerID)
            if (playerInfo != undefined) {
                this.getChildByName(player.playerID).children.forEach((field) => {
                    for (let stat in player.stats) {
                        if (field.name == stat) {
                            field.setValue(player.stats[stat].toString())
                        }
                    }
                })
            }
        })
    }
}
