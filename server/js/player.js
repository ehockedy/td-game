class Player {
    constructor(id, index) {
        this.id = id;
        this.index = index // Which player number are they
        this.ready = false // Whether they are ready to start teh round i.e. have spent money, edited toweers etc.

        this.stats = {
            "points": 0,
            "money": 150
        }
    }

    registerKill(points, money) {
        this.stats.points += points
        this.stats.money += money
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

    reduceMoney(amount) {
        this.stats.money = Math.max(0, this.stats.money - amount)
    }

    increaseMoney(amount) {
        this.stats.money += amount
    }

    getMoney() {
        return this.stats.money
    }
}

module.exports = {
    Player: Player
}
