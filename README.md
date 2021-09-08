# Defence of Karragarra Valley
**Overview**\
Defence of Karragarra Valley (name not final) is an online, browser based, 2D, cooperative and competitive tower defence game. Work with up to three friends to defend your towns from the monsters and bandits that attack via the winding valley. Construct towers to kill enemies, then loot the enemies and use that loot to upgrade and buy more towers.

If enough enemies get through your defences, then everyone loses. But if you manage to hold out for enough rounds then whoever has the most points is the winner!

**Technical Info**\
VTD is implemented with a server and a client model. The server is authoritative, and all game state is stored in there. The server runs the game loop and sends any updates to each connected client. There is no client to client communication. The server and game logic is written in [Node.js](https://nodejs.org/).
The client handles all user interaction and the rendering of sprites, and is written in JavaScript using the [PixiJS](https://www.pixijs.com/) rendering library to handle all rendering and interface interaction events.

Sprites are all hand created as vector images using [Inkscape](https://inkscape.org/) vector graphics editor and package using [TexturePacker](https://www.codeandweb.com/texturepacker). The enemy sprites are animated with [Spriter](https://brashmonkey.com/spriter-pro/).

**Features**
* Randomly generated maps
* Random enemy generation
* Multiple unique towers (more coming soon)
* Tower upgrades (coming soon)
* Save game functionality (coming soon)

**Progress Update**\
This is a snapshot of gameplay as of 08/09/2021

Note that frame rate in the .gif is not representative of actual game frame rate.

![](docs/menu_demo.gif)
![](docs/game_demo.gif)

**Deploying app for development**
Start webpack to dynamically build code during editing
`npx webpack -w`

Separately, start the server
`npm start`
