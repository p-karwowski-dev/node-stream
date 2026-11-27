# Space Strategy Game: UI Specification

**Status:** Draft notes only. The full UI specification is still to be written.
**Scope:** Lobby, in-game UI, rendering. Server logic is in `game-design.md`. Rules are in `game-rules.md`.

## MVP scope

The UI layout is based on the mock `mock Orbital Conquest.png`. The mock is used only to help place elements on the screen. It is not a source of requirements, names, numbers or styling.

The MVP covers only the essential functionality that allows end-to-end gameplay. It does not focus on styling. It displays functional boxes only.

The MVP is a human against AI players only. It has a simple UI and runs against a local server. Its purpose is to let a developer test all game mechanics end to end. Spectators and multiple human players are out of scope.

Essential functionality:

1. Lobby.
   - Add and remove AI players.
   - Show connected players.
   - Edit match parameters.
   - Start the game.
2. Main screen.
   - Countdown: shows `countdownSeconds` from `matchStarted` before ticks begin.
   - Left panel: list of planets. No sorting and no styling. Each entry shows the planet name in the colour of its owner (note 7), plus the ship count.
   - Main 3D space: planets and links, with basic colours. Each planet shows its owner (by colour) and its ship count.
   - Ships: drawn as basic instanced points or dots (note 4), positioned by interpolation (note 5b).
   - Claim a planet: the player clicks a rogue planet to claim it as a starting planet (note 5).
   - Links: the player picks a source planet and a target planet within `maxHopDistance` to create a link, and can remove an existing link (note 6).
   - Message bar: a brief message at the top of the screen, for example when `commandRejected` arrives.
3. End screen. Displayed when the game ends. It shows a plain winner line and a Play again button that takes the player back to the lobby. The lobby keeps the previous players, AI players and match parameters.

## Notes collected from the server discussion

1. Candidate UI stack: React (lobby and HUD), three.js (3D scene), Electron (desktop shell), WebGPU. Three.js `WebGPURenderer` falls back to WebGL 2 when WebGPU is not available.
2. The server sends ship departures (ship, source, target, departure time, arrival time), not positions every tick. The client computes ship positions by interpolating along the link.
3. The server owns simulation time (`tick × tickLengthMs`). The client needs the server's current tick to place ships correctly.
4. Measured peak ships in flight (M4 benchmark, seed 1, 20 AI players, `game-design.md` Section 2): about 1,600 on the default map (1,000 planets), 6,100 on a 15x15x15 grid and 15,500 on a 20x20x20 grid (8,000 planets). Ships need instanced rendering (or points), not one object per ship.
5. Starting planet selection happens during the running match (rules Section 10.4). The UI must make rogue planets easy to find and claim quickly. A claim is confirmed when a `planetChanged` event shows the player as owner, or rejected with `commandRejected`.
   5a. After `startMatch` the server sends `matchStarted` with `countdownSeconds` (default 5). The UI displays the countdown. Ticks begin when it ends.
   5b. The client clock is driven by `tick` messages, not by wall-clock time, so fast mode speeds the animation up. Ship position = interpolation between `departureTime` and `arrivalTime` at the current match time.
6. Link creation and removal are the only in-game player actions (`game-rules.md`, Section 10). The UI needs a way to pick a source planet and a target planet within `maxHopDistance`.
7. Planet colours: green glow for own planets, red glow for enemy planets, one neutral colour for rogue and neutral planets. Spectators see the same colours.
8. The lobby needs: create match, edit parameters, add and remove AI players, show connected players, host starts the match.

## MVP client

The MVP client is in `packages/client`. How to start it is in `docs/README.md`.

1. Stack: Vite, React for the lobby and HUD, three.js `WebGLRenderer` for the 3D scene. `WebGPURenderer` can replace it later; the renderer is created only in `scene/spaceScene.ts`.
2. Folders: `protocol` (WebSocket and JSON), `state` (client state, a pure reducer for server messages, planet and clock helpers) and `session` (connection plus state plus player actions) have no React, three.js or DOM code apart from the global `WebSocket`. The Electron shell reuses them. `ui` is React, `scene` is three.js, `browser` holds the server URL and token storage.
3. Claim: click a rogue planet in the 3D view or in the planet list. The claim is confirmed when the planet turns green.
4. Links: click one of your planets to select it as the link source. It is drawn larger and marked in the list. Then click a planet within `maxHopDistance`, or a button in the In range list of the selection panel, to create a link. The source stays selected, so several links can be made in a row. Clicking another of your planets out of range selects it instead. Each link of the source is listed with a Remove button. Clear, or clicking the source again, deselects it.
5. Planet names are `Planet <id>`. The number shown per planet, in the list and in the 3D view, is its current points. The protocol carries no per-planet ship count after the start, and with `hopDelayTicks` 0 ships never wait on a planet between ticks.
6. Colours: own green, enemy red, rogue and neutral grey. Links take the colour of their source planet. Ships are green or red points.
7. Clock: match time is the last tick times `tickLengthMs`, plus the time since that tick message, capped at one tick. The countdown uses local time from the arrival of `matchStarted`, because no ticks arrive during it.
8. The message bar at the top shows `commandRejected` for the player's own commands (client command IDs start at 1,000,000,000, so AI rejections are not shown), server errors and local hints for 5 seconds.
9. Reconnect: the reconnect token is kept in `sessionStorage`, so a page reload rejoins as the same player. A second tab joins as a new player. A lost connection shows a Reconnect button.
10. End screen: Play again sends `returnToLobby`. Only the host may send it. The lobby keeps players, AI players and parameters, including the seed.
11. Rendering, measured in M6 with 20 players (19 AI), Chrome on an Apple M1 GPU, production build: the default map stays at 60 frames per second at its peak of about 900 ships in flight. The 20x20x20 map (8,000 planets) runs at 28 to 35 frames per second at about 14,000 ships in flight, and at 6 to 10 in the Vite dev build. The cost on the large map is React re-rendering the 8,000-entry planet list and CSS2D placing 8,000 labels each frame, not the ships. Reducing it (list virtualization, label culling) is a post-MVP task.
