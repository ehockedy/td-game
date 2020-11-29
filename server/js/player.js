class Player {
    constructor(id, index) {
        this.id = id;
        this.index = index // Which player number are they
        this.ready = false // Whether they are ready to start teh round i.e. have spent money, edited toweers etc.

        this.stats = {
            "points": 0,
            "money": 200
        }
    }

    registerKill() {
        this.stats.points += 1
        this.stats.money += 1
    }

    setReady() {
        this.ready = true
    }

    unsetReady() {
        this.ready = false
    }

    isReady() {
        return this.ready
    }
}

module.exports = {
    Player: Player
}
