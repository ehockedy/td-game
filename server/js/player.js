class Player {
    constructor(id, index) {
        this.id = id;
        this.index = index // Which player number are they

        this.stats = {
            "points": 0,
            "money": 200
        }
    }

    registerKill() {
        this.stats.points += 1
        this.stats.money += 1
    }
}

module.exports = {
    Player: Player
}
