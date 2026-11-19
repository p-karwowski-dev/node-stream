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
4. Roughly 30,000 ships can be in flight at the same time with the default config. Ships need instanced rendering (or points), not one object per ship.
5. Starting planet selection happens during the running match (rules Section 10.4). The UI must make rogue planets easy to find and claim quickly. A claim is confirmed when a `planetChanged` event shows the player as owner, or rejected with `commandRejected`.
   5a. After `startMatch` the server sends `matchStarted` with `countdownSeconds` (default 5). The UI displays the countdown. Ticks begin when it ends.
   5b. The client clock is driven by `tick` messages, not by wall-clock time, so fast mode speeds the animation up. Ship position = interpolation between `departureTime` and `arrivalTime` at the current match time.
6. Link creation and removal are the only in-game player actions (`game-rules.md`, Section 10). The UI needs a way to pick a source planet and a target planet within `maxHopDistance`.
7. Planet colours: green glow for own planets, red glow for enemy planets, one neutral colour for rogue and neutral planets. Spectators see the same colours.
8. The lobby needs: create match, edit parameters, add and remove AI players, show connected players, host starts the match.
