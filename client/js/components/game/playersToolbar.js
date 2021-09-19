import { BaseComponent } from "./base/baseComponent.js";
import { PlayerPointCounter } from "./ui/playerPointCounter.js";
import { colourHash2Hex } from "./../../tools.js"

export class PlayersToolbar extends BaseComponent {
    constructor(players) {
        super("playerinfo")

        this.gap = 10
        for(let player in players) {
            const playerData = players[player]
            let ppc = new PlayerPointCounter(0, 0, 200, playerData.displayName, 0, colourHash2Hex(playerData.colour))
            ppc.name = playerData.id
            ppc.y = this.children.length * (ppc.height + this.gap)
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
        // Order stores the player indexes in the order of how many points they have (highest first)
        let order = []

        playersData.objects.forEach((player, idx) => {
            let playerInfo = this.getChildByName(player.playerID)
            if (playerInfo != undefined) {
                playerInfo.update(player.stats.points)
            }

            // Add to back of list
            order.push(idx)
            // Search over list, starting form one before one just added (previous smallest)
            for (let i = (order.length-2); i >= 0; i--) {
                // If new value bigger, swap
                if (player.stats.points > playersData.objects[order[i]].stats.points) {
                    let tmp = order[i]
                    order[i] = idx
                    order[i+1] = tmp
                }
            }
        })

        // Adjust the player info so that the highest scoring player appears first
        order.forEach((playerIdx, posIdx) => {
            let player = this.getChildByName(playersData.objects[playerIdx].playerID)
            player.y = posIdx * (player.height + this.gap)
        })
    }
}
