# Space Strategy Game: UI Specification

**Status:** Draft notes only. The full UI specification is still to be written.
**Scope:** Lobby, in-game UI, rendering. Server logic is in `game-design.md`. Rules are in `game-rules.md`.

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
