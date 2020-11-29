import { BaseToolbarComponent } from "./base/baseToolbarComponent.js";
import { getPositionWithinEquallySpacedObjects } from "../../tools.js"

export class PlayersToolbar extends BaseToolbarComponent {
    constructor(sprite_handler, width_px, height_px, x, y) {
        super(sprite_handler, "playerinfo", width_px, height_px, x, y)

        this.yOffsetGap = 20
    }

    addPlayer(info) {
        if (!this.container.getChildByName(info.playerID)) {
            let playerInfoContainer = this.renderPlayerInfo(info)
            playerInfoContainer.x = getPositionWithinEquallySpacedObjects(info.index+1, 4, this.width_px/4, this.width_px) - this.width_px/4/2
            this.container.addChild(playerInfoContainer)
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

            // Description title
            text = new PIXI.Text(field, defaultStyle);
            text.x = Math.floor(xMargin)
            text.y = Math.floor(yOffset)
            text.name = field
            text.type = "name"
            text.style.fontSize = 16
            localContainer.addChild(text);

            // Description content
            text = new PIXI.Text(0, defaultStyle);
            text.x = Math.floor(this.width_px/4 - xMargin)
            text.y = Math.floor(yOffset)
            text.anchor.set(1, 0) // Shift right
            text.style.fontWeight = "normal"
            text.style.fontSize = 16
            text.name = field
            text.type = "value"
            localContainer.addChild(text);
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
        this.container.children.forEach((child) => {
            let readyIcon = child.getChildByName("readyIcon")
            if (readyIcon) readyIcon.visible = false
        })
    }

    _setReadiness(playerID, readiness) {
        let playerInfoContainer = this.container.getChildByName(playerID)
        if (playerInfoContainer) {
            playerInfoContainer.getChildByName("readyIcon").visible = readiness
        }
    }

    update(playersData) {
        playersData.objects.forEach((player) => {
            let playerInfo = this.container.getChildByName(player.playerID)
            if (playerInfo != undefined) {
                this.container.getChildByName(player.playerID).children.forEach((field) => {
                    for (let stat in player.stats) {
                        if (field.name == stat && field.type == "value") {
                            field.text = player.stats[stat].toString()
                        }
                    }
                })
            }
        })
    }
}
