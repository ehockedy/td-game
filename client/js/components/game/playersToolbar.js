import { BaseComponent } from "./base/baseComponent.js";
import { PlayerPointCounter } from "./ui/playerPointCounter.js";
import { colourHash2Hex } from "./../../tools.js"

export class PlayersToolbar extends BaseComponent {
    constructor(players) {
        super("playerinfo")

        const gap = 10
        for(let player in players) {
            const playerData = players[player]
            let ppc = new PlayerPointCounter(0, 0, 200, playerData.displayName, 0, colourHash2Hex(playerData.colour))
            ppc.name = playerData.id
            ppc.y = this.children.length * (ppc.height + gap)
            this.addChild(ppc)
        }
    }

    // setPlayerReady(playerID) {
    //     this._setReadiness(playerID, true)
    // }

    // unsetPlayerReady() {
    //     this._setReadiness(playerID, false)
    // }

    // unsetAllPlayers() {
    //     // TODO this could be done more nicely
    //     this.children.forEach((child) => {
    //         let readyIcon = child.getChildByName("readyIcon")
    //         if (readyIcon) readyIcon.visible = false
    //     })
    // }

    // _setReadiness(playerID, readiness) {
    //     let playerInfoContainer = this.playersContainer.getChildByName(playerID)
    //     if (playerInfoContainer) {
    //         playerInfoContainer.getChildByName("readyIcon").visible = readiness
    //     }
    // }

    update(playersData) {
        playersData.objects.forEach((player) => {
            let playerInfo = this.getChildByName(player.playerID)
            if (playerInfo != undefined) {
                playerInfo.update(player.stats.points)
            }
        })
    }
}
