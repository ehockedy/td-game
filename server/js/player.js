class Player {
    constructor(id, index) {
        this.id = id;
        this.index = index // Which player number are they
        this.ready = false // Whether they are ready to start teh round i.e. have spent money, edited towers etc.
        this.connected = true

        this.stats = {
            "points": 0,
            "money": 150
        }
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

    setConnected(isConnected) {
        this.connected = isConnected
    }

    isConnected() {
        return this.connected
    }

    reduceMoney(amount) {
        this.stats.money = Math.max(0, this.stats.money - amount)
    }

    increaseMoney(amount) {
        this.stats.money += amount
    }

    increasePoints(amount) {
        this.stats.points += amount
    }

    getMoney() {
        return this.stats.money
    }
}

module.exports = {
    Player: Player
}
