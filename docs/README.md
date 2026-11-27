# node-stream

Space strategy game: server and browser client. Design documents: `game-rules.md`, `game-design.md`, `game-ui.md`.

## Setup

```
npm install
npm run check
```

`npm run check` runs the type check and the no-comments check.

## Simulate a match with AI players

`run-match` plays a headless match with AI players only (strategy `weakestInRange`) and prints the result and timing.

```
npm run run-match
npm run run-match -- --seed 1
npm run run-match -- --seed 1 --ai-players 20
npm run run-match -- --config my-config.json --ai-players 8
```

| Option                | Meaning                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `--seed <integer>`    | Seed of the match. Without it, the seed from the config file, or a random one. The seed used is always printed. |
| `--ai-players <n>`    | Number of AI players, from 1 to `maxPlayers`. Default 4.             |
| `--config <path>`     | JSON file with any subset of the parameters from `game-rules.md` Section 3. Other parameters keep their defaults. |

Example config file:

```
{ "planetDistribution": [15, 15, 15], "matchDurationSeconds": 120 }
```

The same seed, config and AI count always give the same result.

## Benchmark

```
npm run benchmark
```

Runs 20 AI players on the default map and on 15x15x15 and 20x20x20 grids, and prints ticks per second, the slowest tick and peak ship counts. `--seed <integer>` changes the seed (default 1).

## Start the server

```
npm run start-server
npm run start-server -- --port 9000
```

The server and lobby listen on `ws://127.0.0.1:8080` (`--port <1..65535>` changes the port). It is for local use only: it binds to 127.0.0.1 and has no passwords and no TLS. Ctrl-C stops it.

The seed is random. It is printed on the console and sent as `config.seed` in every `lobbyState`. The host can change it, and any other parameter, with `setConfig`. Console output:

```
lobby open on ws://127.0.0.1:8080, seed 1959013103
match started: 4 players, 125 planets, seed 1
match ended at tick 151: timer, winner player 3; command log: 48 commands
lobby reopened
server stopped
```

One server runs one match at a time. After the match ends, the result stays available to reconnecting players until the host sends `returnToLobby` (Play again in the client). That reopens the lobby with the same players, AI players and parameters.

## Play in the browser

Start the server and the client in two terminals:

```
npm run start-server
npm run start-client
```

Open `http://127.0.0.1:5173`, enter a name and join. The first player is the host: add AI players, edit the parameters and start the match. Reloading the page reconnects to the same player.

For a server on another port, pass the URL to the client:

```
npm run start-server -- --port 9000
VITE_SERVER_URL=ws://127.0.0.1:9000 npm run start-client
```

`npm run build-client` writes a production build to `packages/client/dist/app`. `VITE_SERVER_URL` applies at build time too. How to play is in `game-ui.md`, section MVP client.

## Protocol

Connect to `ws://127.0.0.1:<port>` and send one JSON object per message:

1. Send `{ "type": "join", "name": "Alice" }`. The reply is `joined { playerId, token, isHost }`. The first human who joins is the host.
2. Keep the `token`. After a disconnect, open a new connection and send `{ "type": "reconnect", "token": "..." }`. You get `joined` again and then the current state.
3. The host edits the config with `{ "type": "setConfig", "changes": { "matchDurationSeconds": 120 } }`, adds AI players with `{ "type": "addAi", "strategy": "weakestInRange" }`, removes them with `removeAi { playerId }`, and starts with `{ "type": "startMatch" }`. After the match ends, the host sends `{ "type": "returnToLobby" }` to reopen the lobby.
4. During the match, send `claimPlanet { commandId, planetId }`, `createLink { commandId, from, to }` and `removeLink { commandId, from, to }`. Choose your own `commandId` values; rejected commands come back as `commandRejected` with that ID.

Server messages: `joined`, `lobbyState` (on every lobby change), `matchStarted` (full state and countdown), `tick` (one per tick, with events; the last one contains `matchEnded`), `snapshot` (full state after a reconnect), `error { code, message, configErrors }`.

Limits: 4 KiB per message (larger messages get `error messageTooLarge`), 64 KiB hard limit (the connection is closed), binary messages are rejected, and the connection is closed after 10 invalid messages. Unknown fields are rejected. Names are 1 to 32 characters.

Message fields and error codes are in `game-design.md` Section 11.
