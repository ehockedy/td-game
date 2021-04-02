## Documentation

**Client events**
These are events that the client will receive and process.
|Event|Description|
|---|---|
|client/game/update | Provides new game state object used to update all the rendered components|
|client/game/round/end | Tells the client that the round has finished|
|client/game/round/start | Tells the client that the round has begun|
|client/map/set|Provides new map and tells client to re-render|
|client/map/update | Provides new map|
|client/player/add | Provides new player to display|
|client/player/addSelf | Provides new player to display, and register that this is the user|
|client/player/ready | Confirms that this player's readiness to start the game has been acknowledged|
|client/player/remove | Stop rendering info about this player as they have left the game|
|client/player/notFound | Tells the player that they are not a member of the given game|
|client/view/lobby | Tells the client to transition to the lobby view |
|client/view/game | Tells the client to transiton to the game view |

**Server events**
These are events that the server will receive and process.
|Event|Description|
|---|---|
|server/session/join | Tells the server that this player wants to create a new game or join an existing one|
|server/session/checkGame | Verifies if the game exists for the given code|
|server/game/round/start | Tell the server that this player is ready to begin the round. Starts the round if all players ready |
|server/game/start | Tell the server that this players are ready to begin the game |
|server/map/get | Returns the map to the client that asked only|
|server/map/regenerate | Generates a new map and updates all client with the new map|
|server/map/set|Adds a new object to the map|
|server/tower/update | Updates the state of a tower|