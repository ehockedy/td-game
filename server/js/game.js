var state = {
  "players": [
    {
      "player1": {
        "x": 50,
        "y": 50
      }
    }
  ]
}

movePlayer = function (id, x, y) {
  state["players"][0][id]["x"] += x;
  state["players"][0][id]["y"] += y;
};

exports.updateGameState = function() {
  movePlayer("player1", 2, 2)
  return state;
}

exports.getGameState = function () {
  return state;
}