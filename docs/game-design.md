# Space Strategy Game: Server Design

**Version:** 0.1 (draft for review)
**Scope:** Server side only: architecture, modules, data model, tick processing, lobby, AI players and protocol. Game rules are in `game-rules.md`. UI is in `game-ui.md`. Code conventions are in `.kiro/steering/code.md`.

## 1. Goal

A local MVP. One command starts the server. A player opens the lobby, adds AI players, sets parameters, starts the match, claims a planet, and plays to a win condition. All user actions and game functions can be tested end to end.

MVP functions:

1. Start the server.
2. Launch a game (the UI is described in `game-ui.md`).
3. Open the lobby.
4. Add multiple AI players. An AI player issues the same commands a human would.
5. Set parameters and win conditions (rules Section 3).
6. Play a match end to end, with every player action and game function available.

Not in the MVP: accounts, database, matchmaking, multi-machine scaling, anti-cheat, replays, automated tests (added on request).

## 2. Decisions

| Topic                | Decision                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| Approach             | A pure simulation core with thin adapters, built once and kept. No throwaway prototype. |
| Language and runtime | TypeScript (strict) on Node.js                                                          |
| Transport            | `ws` (plain WebSocket), JSON messages                                                   |
| Framework            | None for the MVP                                                                        |
| Repository           | One repository, npm workspaces in `packages/`                                           |
| Tooling              | `tsc` for type checking, `tsx` to run TypeScript in development, Vite for the client    |
| Code rule            | No comments in code files. A check script enforces this.                                |
| Matches              | One match at a time, one process, one thread                                            |
| Client               | Browser first. Electron is added later.                                                 |
| Time                 | Simulated: tick `n` ends at `n × tickLengthMs` (rules Section 6.4)                      |

Why a single thread is enough: a tick handles only the ships that arrive or are produced in that tick, not every ship in flight (Section 6). Benchmark results from milestone M4 (seed 1, 20 AI players, `npm run benchmark`):

| Map                  | Planets | Ticks per second | Slowest tick | Peak ships produced per second | Peak ships in flight | Peak arrivals per tick |
| -------------------- | ------: | ---------------: | -----------: | -----------------------------: | -------------------: | ---------------------: |
| Default (10x10x10)   |    1000 |             5205 |        5 ms  |                            608 |                1,623 |                    274 |
| Grid 15x15x15        |    3375 |             1428 |       24 ms  |                          2,617 |                6,116 |                    937 |
| Grid 20x20x20        |    8000 |              364 |       75 ms  |                          7,794 |               15,467 |                  2,167 |

Real time needs 10 ticks per second, and one tick has a budget of 100 ms. All three maps fit. Arrivals come in bursts because every owned planet produces on the same tick.

## 3. Repository layout

```
node-stream/
  package.json                 workspaces: packages/*
  tsconfig.base.json           strict mode
  docs/                        game-rules.md, game-design.md, game-ui.md
  tools/                       check script for the no-comments rule
  .kiro/steering/              code.md
  packages/
    shared/
      src/
        types/                 ids, vector, config, commands, events
        protocol/              client-to-server and server-to-client messages
        index.ts
    server/
      src/
        core/                  pure simulation
        adapters/
          network/
          lobby/
          ai/
          runner/
        cli/                   start server, headless match, benchmark
    client/                    described in game-ui.md
```

Dependency rule: `core` imports only `shared` and itself. `adapters` import `core` and `shared`. `cli` imports adapters. Nothing in `core` touches the network, timers, files or the wall clock.

## 4. Core modules

Each module lives in its own folder under `server/src/core/` and exposes a small interface through its `index.ts`.

| Module     | Owns                                                           | Rules               |
| ---------- | -------------------------------------------------------------- | ------------------- |
| `config`   | Defaults and validation                                        | Section 3, 3.1      |
| `random`   | Named seeded streams: `createStream(seed, name)`               | Section 4, 4.9      |
| `world`    | Generator, spatial index, distance and reachability checks     | Section 4           |
| `planets`  | Planet state, points, ownership, rogue and neutral transitions | Sections 2, 7.5     |
| `links`    | Link registry, ordered outgoing list per planet, cursor        | Sections 6.2, 8     |
| `players`  | Player roster, claimed and eliminated flags                    | Sections 9.1, 10.4  |
| `ships`    | Ship creation, ship ID counter, speed and decay                | Sections 6.4, 7.4   |
| `arrivals` | Queue of ships in flight, ordered by arrival time              | Section 6.4         |
| `fleets`   | Fleet per player per planet, fleet order, ready ships          | Sections 6.3, 7.4   |
| `combat`   | Ship-to-ship and ship-to-planet battles                        | Section 7.1, 7.2    |
| `dispatch` | Production, round-robin routing, reinforce or depart           | Sections 6, 7.3     |
| `commands` | Command queue, validation and application                      | Sections 5, 8, 10.4 |
| `outcome`  | Elimination, domination, timer, tie-break                      | Section 9           |
| `match`    | Match state and the tick pipeline                              | Section 5           |

### 4.1 Public interface of the core

| Call                              | Purpose                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `createMatch(config, players)`    | Validates the config, generates the world, returns a match. AI players claim planets here. |
| `match.submit(playerId, command)` | Adds a command to the queue for the next tick. Returns nothing.                            |
| `match.step()`                    | Runs one tick. Returns the tick number and its events.                                     |
| `match.snapshot()`                | Returns the full state, used for reconnect and by AI players.                              |
| `match.view()`                    | Read-only view of the world for AI strategies.                                             |

### 4.2 Commands

| Command       | Data         |
| ------------- | ------------ |
| `claimPlanet` | `planetId`   |
| `createLink`  | `from`, `to` |
| `removeLink`  | `from`, `to` |

Every command carries a `commandId` chosen by the sender. A command dropped when applied produces a `commandRejected` result with a reason (`planetTaken`, `alreadyClaimed`, `notOwner`, `outOfRange`, `linkExists`, `linkMissing`, `invalidPlanet`).

## 5. Determinism

The simulation gives the same result for the same config, seed and applied commands.

1. **Seeded random.** A seed always produces the same sequence of random numbers. Each use of randomness gets its own named stream, created from the seed and a name. Streams are independent: a change in how many numbers one purpose draws never moves the numbers of another. Streams in the MVP: `world` (positions and planet points) and `aiClaims` (random starting planets of AI players). `Math.random` is not used in the simulation. A random seed is chosen when the config is created and stored in it, so every match can be reproduced.
2. **Ship IDs.** One counter per match, starting at 1, never reused. Ships are created only by production. Production runs in ascending planet ID order, and ships of one planet's round get consecutive IDs.
3. **Planet IDs.** Contiguous from 0, assigned after the generator finishes. Grid mode goes x, then y, then z. Random mode keeps generation order after removals.
4. **Links.** Identified by source and target planet. They have no ID.
5. **Ordering inside a phase.** Planets are handled in ascending ID order. Each phase finishes for all planets before the next phase starts, so outcomes do not depend on planet order. Planet order affects only ship IDs and the order of events.
6. **Arrival order.** The arrival queue orders by arrival time, then ship ID. Ships are appended to the destination fleet in that order.
7. **Commands.** Applied in the order the server received them. The server records the applied order together with the tick, so a match can be replayed from the config, seed and command log.
8. **Numbers.** Link length is computed once, when the world is built. Later math uses only `+ - * /` and `sqrt`, not `hypot`, `pow` or trigonometry. `tickLengthMs` is an integer, so tick times are exact.

## 6. Data model

| Entity         | Fields                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Player         | `id`, `name`, `kind` (human or ai), `claimed` (boolean), `eliminated` (boolean), `shipCount`                                            |
| Planet         | `id`, `position {x,y,z}`, `points`, `maxPoints`, `ownerId or null`, `outgoing` (ordered list of links), `cursor`, `fleets` (per player) |
| Link           | `from`, `to`, `length`                                                                                                                  |
| Ship           | `id`, `ownerId`, `hopsDone`, `readyTick`                                                                                                |
| In-flight ship | `ship`, `from`, `to`, `departureTime`, `arrivalTime`                                                                                    |
| Fleet          | ordered list of ships of one player on one planet                                                                                       |
| Match          | `config`, `tick`, `planets`, `players`, `arrivalQueue`, `occupiedPlanets`, `nextShipId`, `commandQueue`, `status`                       |

Notes:

1. A fleet is a deque. Removing from the front must be O(1).
2. Ship speed is derived: `initialShipSpeed − hopsDone × initialShipSpeed × speedDecayPercent ÷ 100`. A speed of 0 or less means the ship cannot depart (rules Section 6.4.4).
3. `readyTick` is the tick when a ship's hop delay ends. Produced ships are ready in their production tick. Arriving ships are ready at arrival tick plus `hopDelayTicks`.
4. The match keeps running counters per player: planets owned and ships alive (in flight and on planets). Elimination, domination and the ship tie-break read these counters instead of scanning all ships.
5. `occupiedPlanets` is the set of planets that currently hold at least one ship.

## 7. Tick pipeline

`match.step()` increments the tick and runs the phases below. Each phase handles all planets before the next starts.

| #   | Phase                 | Work                                                                                                                                                      | Rules                  |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 0   | Commands              | Apply queued commands in order. Drop invalid ones.                                                                                                        | Section 5              |
| 1   | Arrivals              | Pop ships from the arrival queue while `arrivalTime ≤ tick × tickLengthMs`. Append each to its destination fleet.                                         | Sections 6.4, 7.4      |
| 2   | Production            | If `tick` is a multiple of `productionIntervalTicks`, every player-owned planet creates `shipsPerProduction` ships and appends them to the owner's fleet. | Section 6.1            |
| 3   | Ship-to-ship battle   | Resolve each occupied planet with fleets of two or more players.                                                                                          | Section 7.1            |
| 4   | Ship-to-planet battle | Surviving non-owner fleets attack. Planets become neutral or are captured. Links are removed.                                                             | Section 7.2, 8.7       |
| 5   | Dispatch or reinforce | Owner fleets depart or reinforce. Departing ships take ready ships in fleet order, skipping waiting ones.                                                 | Sections 6.2, 6.3, 7.3 |
| 6   | Outcome               | Elimination, domination, timer.                                                                                                                           | Section 9              |

Notes:

1. Departing ships are added to the arrival queue with `arrivalTime = tick × tickLengthMs + length ÷ speed × 1000`. A ship can never arrive in its departure tick, because its arrival time is later than the end of that tick.
2. Phases 3 to 5 visit only occupied planets. With a hop delay of 0 this set is empty after every tick.
3. Phase 2 touches every owned planet, but only on production ticks.
4. Each phase returns events. The tick result is the combined list.

## 8. Events

Events are defined in `shared` and are the only output of a tick.

| Event              | Data                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `shipDeparted`     | `shipId`, `ownerId`, `from`, `to`, `departureTime`, `arrivalTime`           |
| `planetChanged`    | `planetId`, `ownerId`, `points`. Final state for the tick, once per planet. |
| `linkCreated`      | `from`, `to`                                                                |
| `linkRemoved`      | `from`, `to`                                                                |
| `commandRejected`  | `commandId`, `reason`                                                       |
| `playerEliminated` | `playerId`                                                                  |
| `matchEnded`       | `winnerId or null`, `reason` (domination, timer, elimination), `standings`  |

Ship arrival and destruction need no event. The client knows the arrival time from `shipDeparted` and sees results in `planetChanged`. Ships removed for having no speed never depart, so they have no event.

## 9. Match lifecycle

Phases: `lobby` → `running` → `ended`.

Start sequence, run by the lobby adapter when the host sends `startMatch`:

1. Validate the config (rules Section 3.1). Reject with the list of errors if invalid.
2. Freeze the lobby. No new players join.
3. Call `createMatch`. The world is generated and each AI player claims a different random rogue planet.
4. Send `matchStarted` to every connected human, with `countdownSeconds` from `startCountdownSeconds`. The UI shows the countdown.
5. After the countdown, the runner starts calling `step()`. Tick 1 begins.
6. Human players send `claimPlanet` during the match.

A match ends on `matchEnded`. The `ended` phase keeps the result available for display.

## 10. Adapters

### 10.1 runner

Drives `match.step()`.

1. Real-time mode: schedules ticks from a monotonic clock so errors do not accumulate. If the server falls behind, it runs the missing ticks, up to a cap per cycle.
2. Fast mode: steps without waiting. Used for headless matches and the benchmark. It is a runner option, not a game parameter.
3. Hands each tick result to the network adapter and to the command log.

### 10.2 lobby

1. Keeps the player list (humans and AI), the host, and the config being edited.
2. Host-only actions: edit config, add or remove AI, start the match.
3. The host is the first human who joins.
4. Enforces `maxPlayers`.
5. After the match starts, only existing players can reconnect.

### 10.3 network

1. WebSocket server using `ws`.
2. A session per connection. A reconnect token (random identifier created on `join`) maps a returning connection to its player.
3. Validates every incoming message: shape, field types and size. Unknown or invalid messages get an `error` and are ignored.
4. Sends the per-tick message to every connected human, including eliminated players, who become spectators.
5. Local use only: no passwords, no TLS.

### 10.4 ai

AI players run in the server and call the core directly. They do not use the network protocol.

1. A strategy is a module with one function: given the read-only match view and the player ID, return commands.
2. The AI adapter calls each AI player's strategy at an interval measured in ticks, using simulated time, and submits the returned commands.
3. First strategy, `weakestInRange`. Every `decisionIntervalTicks` ticks (default 10, a strategy option), for each planet the AI owns:
   - If the planet has no outgoing link, create a link to the planet within `maxHopDistance` that the AI does not own and that has the fewest current points. Ties go to the lowest planet ID.
   - If the planet has an outgoing link whose target the AI now owns, remove it and apply the rule above.
   - If no planet in range qualifies, do nothing. The planet's ships reinforce it.
   - Known limit: a planet with no unowned planet in range stays idle. Routing through own planets can be added as a separate strategy.
4. More strategies can be added by implementing the same function. The strategy is chosen with `addAi {strategy}`.

### 10.5 cli

| Command        | Purpose                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `start-server` | Starts the WebSocket server and lobby                                                                  |
| `run-match`    | Runs a headless match with AI players only, from a config file and seed. Prints the result and timing. |
| `benchmark`    | Runs `run-match` for the default config and larger maps and reports ticks per second                   |

Usage, options and the config file format are in `docs/README.md`.

## 11. Protocol

WebSocket, one JSON object per message with a `type` field.

### 11.1 Client to server

| Message                             | Phase   | Who              | Purpose                     |
| ----------------------------------- | ------- | ---------------- | --------------------------- |
| `join {name}`                       | lobby   | anyone           | Enter the lobby             |
| `reconnect {token}`                 | any     | existing players | Return after a disconnect   |
| `setConfig {changes}`               | lobby   | host             | Edit parameters             |
| `addAi {strategy}`                  | lobby   | host             | Add an AI player            |
| `removeAi {playerId}`               | lobby   | host             | Remove an AI player         |
| `startMatch`                        | lobby   | host             | Start the match (Section 9) |
| `claimPlanet {commandId, planetId}` | running | human player     | Claim the starting planet   |
| `createLink {commandId, from, to}`  | running | human player     | Queue a link                |
| `removeLink {commandId, from, to}`  | running | human player     | Queue a link removal        |

### 11.2 Server to client

| Message                                                            | Purpose                                                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `joined {playerId, token, isHost}`                                 | Reply to `join` and `reconnect`                                                                   |
| `lobbyState {players, config, hostId}`                             | Sent on every lobby change                                                                        |
| `matchStarted {countdownSeconds, config, players, planets, links}` | Initial full state. Tick 0.                                                                       |
| `tick {tick, events}`                                              | One per tick, even with no events, so the client clock stays in sync                              |
| `snapshot {tick, planets, links, ships, players}`                  | Full state for a reconnect. `ships` lists every ship in flight with the fields of `shipDeparted`. |
| `error {code, message}`                                            | Invalid message, wrong phase, not host, invalid config                                            |

Accepted commands are confirmed by `linkCreated`, `linkRemoved` or `planetChanged` in a later `tick`. Dropped commands produce `commandRejected` in the `tick` where they were applied.

Ship positions are never sent. The client computes them from `departureTime`, `arrivalTime` and the match time.

## 12. Configuration and validation

1. Defaults live in `core/config`. The lobby holds an editable copy.
2. `setConfig` validates the changes against rules Section 3.1. An invalid change is rejected with all the errors.
3. The config is validated again in `createMatch`.
4. The seed is generated when the config is created, so the lobby can display it.

## 13. World generator

Rules Section 4 defines the result. These are the design choices.

1. **Grid mode.** Planets sit at the centres of cells: position on an axis is `(i + 0.5) × side ÷ n`, where `side` is the cube side and `n` is the count on that axis.
2. **Random mode.** Dart throwing with retries. Positions are drawn from the world stream, uniform in the cube. A position closer than `minPlanetDistance` to a placed planet is rejected. The generator stops at N planets or after `200 × N` attempts in total. Bridson's algorithm can replace this inside the `world` module if large maps need it (Section 13.1).
3. **Filtering.** A spatial hash grid, with a cell size of `maxHopDistance`, finds neighbours. It is also used during random placement to find planets closer than `minPlanetDistance`. After placement, repeatedly drop planets with fewer than `minReachablePlanets` neighbours within `maxHopDistance` until none remain. Then find the connected groups (union-find over neighbour pairs), keep the largest, and drop the rest. If two groups are equal in size, keep the one that contains the first placed planet. Dropping a whole group does not change the neighbour counts of the planets that stay, so no second pass is needed (rules Section 4.6).
4. **Result.** Planet IDs and random points (`planetPointsMin` to `planetPointsMax`) are assigned in ID order from the world stream. Every planet starts rogue.
5. **Failure.** If the final planet count is 0, `createMatch` fails with an error. If it is lower than the number of players, the lobby shows a warning with the final count (rules Section 11, open item 1).

### 13.1 Notes: random distribution research (decided: dart throwing and connected map)

**Problem.** In random mode with `mapScale` 1, the current method (draw N uniform positions, then remove planets that are too close) keeps far fewer planets than requested. Measured with N = 1000, `minPlanetDistance` 200, `maxHopDistance` 400:

| Method                               | mapScale | Placed of 1000        | Volume per planet (in d³) | Mean planets within hop range | Fewest planets within hop range |
| ------------------------------------ | -------- | --------------------- | ------------------------- | ----------------------------- | ------------------------------- |
| Uniform + removal (current)          | 1        | 350                   | 2.86                      | 8.2                           | 1                               |
| Uniform + removal (current)          | 1.25     | 501                   | 3.90                      | 6.2                           | 0                               |
| Uniform + removal (current)          | 2        | 801                   | 9.99                      | 2.6                           | 0                               |
| Dart throwing with retries           | 1        | 775 (limit reached)   | 1.29                      | 16.8                          | 5                               |
| Dart throwing with retries           | 1.25     | 1000 (6,701 attempts) | 1.95                      | 12.3                          | 4                               |
| Dart throwing with retries           | 1.5      | 1000                  | 3.38                      | 7.4                           | 1                               |
| Dart throwing with retries           | 2        | 1000                  | 8.00                      | 3.3                           | 0                               |
| Bridson (maximal set)                | 1        | 649                   | 1.54                      | 14.9                          | 5                               |
| Bridson (maximal set)                | 2        | 4999                  | 1.60                      | 16.8                          | 4                               |
| Jittered grid                        | 1        | 1000                  | 1.00                      | 25.8                          | 10                              |
| Jittered grid                        | 1.25     | 1000                  | 1.95                      | 15.2                          | 6                               |
| Jittered grid                        | 1.5      | 1000                  | 3.38                      | 7.8                           | 3                               |
| Jittered grid                        | 2        | 1000                  | 8.00                      | 2.4                           | 0                               |
| Fibonacci shells (ball, radius 1400) | n/a      | 1000                  | 1.44                      | 18.9                          | 9                               |

How to read it: "volume per planet" is the container volume divided by the placed planets, in units of `minPlanetDistance` cubed. Lower means denser. Single runs with seed 1 (the first row also averaged 3 seeds: 356, 499, 634 and 803 at the four scales). The test script was temporary and is not in the repository.

**Why the current method loses planets.**

1. It makes exactly N attempts. A planet that lands too close to an earlier one is discarded, and nothing replaces it.
2. At `mapScale` 1 the cube is sized for a perfect grid. Random placement of non-overlapping spheres cannot reach grid density. For random sequential addition, the published saturation density in three dimensions is about 0.39 of the volume (fit in Torquato, Uche and Stillinger, 2006). A perfect grid at `mapScale` 1 needs about 0.52 (π/6). Even saturated dart throwing ended at 775 of 1000 in the test.

**Options.**

1. **Dart throwing with retries (Poisson-disk sampling).** Keep drawing seeded random positions, reject any that is closer than `minPlanetDistance` to a placed planet, stop at N planets or at an attempt limit. Same random look as today. About 20 lines. 1000 planets fit at `mapScale` 1.25 in the test, and saturate near 775 at `mapScale` 1.
2. **Bridson's algorithm.** Linear-time Poisson-disk sampling in any dimension (Bridson, SIGGRAPH 2007). It grows a filled set from a seed point, so the count depends on the volume, not on a requested N. It is better suited to filling a space than to hitting a count, and only matters for large N, where dart throwing slows down near saturation. It can replace option 1 inside the `world` module later without other changes.
3. **Jittered grid.** One planet per cell, moved randomly within the room that the cell leaves beyond `minPlanetDistance`. Exact count, guaranteed spacing, fastest, and the most even reachability. At `mapScale` 1 there is no room to move, so it equals the grid. Looks like a distorted lattice.
4. **Orbital shells.** Concentric spheres spaced `minPlanetDistance` apart, with planets spread on each shell by the Fibonacci (golden-angle) spiral. Exact count and spacing (measured minimum 200.0). The world becomes a ball, not a cube, with a visible centre and rings. In the test it was not denser than saturated dart throwing in a cube (1.44 against 1.29), and the ball needs a diameter of 2800 against a cube side of 2000. It is a style choice, not an efficiency gain.

**Reachability, which matters more than density.** With `maxHopDistance` at 2 × `minPlanetDistance`, a planet needs neighbours within 400 units to be usable. In random layouts at `mapScale` 1.5 or more, some planets have 0 or 1 neighbours and are cut off. `minReachablePlanets` removes the weakest ones, but even when every planet has neighbours, the map can split into separate groups that cannot reach each other. The rules do not require one connected map.

**Decision.** Applied in rules Section 4 and in the list above. Orbital shells are skipped for now.

1. Use dart throwing with retries for random mode. Fall back to Bridson only if large maps need it.
2. Enforce rule 4 during placement, so no removal step for rule 4 exists. Rule 5 keeps its removal loop.
3. Add a connectivity step after rule 5: keep only the largest group of planets that can reach each other through links of at most `maxHopDistance`. Remove the others.
4. Build the factor 1.25 into the random base size (rules Section 4.1). In the test, 1000 planets fit at an effective scale of 1.25. `mapScale` keeps its default of 1 and is applied on top of the factor.

**References.**

- Bridson, [Fast Poisson Disk Sampling in Arbitrary Dimensions](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf), SIGGRAPH 2007 sketch.
- Lagae and Dutré, A Comparison of Methods for Generating Poisson Disk Distributions, Computer Graphics Forum 27(1), 2008.
- Torquato, Uche and Stillinger, [Random Sequential Addition of Hard Spheres in High Euclidean Dimensions](https://arxiv.org/abs/cond-mat/0608402), Physical Review E 74, 061308, 2006.
- For comparison, the densest possible sphere packing in three dimensions is 0.7405 and random jammed packings are about 0.64 (see [Dense Sphere Packings from Optimized Correlation Functions](https://arxiv.org/html/0812.3390)).

## 14. Security and robustness

1. All client messages are validated at the network adapter, before they reach the core.
2. A player can only submit commands for their own player ID, taken from the session, not from the message.
3. Message size is capped, and a client sending too many invalid messages is disconnected.
4. The core trusts its input. The network adapter and lobby are the trust boundary.

## 15. Implementation milestones

| #   | Milestone                               | Done when                                                                              |
| --- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| M0  | Repository setup                        | Workspaces, `tsconfig`, `tsx` run, and the no-comments check script pass               |
| M1  | Shared types, config, random            | Config validation and seeded streams work                                              |
| M2  | World generator                         | Grid and random worlds are generated from a seed, with planet IDs                      |
| M3  | Simulation core                         | `createMatch`, `submit`, `step` and `snapshot` implement rules Sections 5 to 10        |
| M4  | Headless runner, AI strategy, benchmark | AI-only matches run in fast mode. Ticks per second on the default config are measured. |
| M5  | Lobby and network                       | A client can join, configure, add AI, start, claim, link, reconnect and see the result |
| M6  | Client connection                       | The UI plays a match end to end (see `game-ui.md`)                                     |

## 16. Open items

1. **Grouped departures.** Revisit after the MVP. Each ship currently has its own `shipDeparted` event, up to about 1000 per second. Grouping ships by link and departure tick would reduce traffic.
2. **Message validation library.** Decide between hand-written type guards and a schema library for the shared protocol.
3. **Replay.** The command log is recorded, but replay playback is not planned for the MVP.
4. **Host handover.** If the host never reconnects before the match starts, the lobby has no host. Not handled in the MVP.
5. **AI tuning.** The interval and the link rules of `weakestInRange` are first guesses. They were not tuned in M4 and are tuned together with game balance after the MVP.
6. **AI gaps found in M4.** `weakestInRange` links each owned planet to the weakest non-owned planet in range. Gaps to address after the MVP:
   - No defence. It does not detect attacks or move ships to a threatened planet.
   - No routing through own planets to the frontier. A planet with no unowned planet in range stays idle.
   - Targeting looks only at planet points, not at enemy fleets or strength.
   - One outgoing link per planet. Multiple links per planet are not used.
   - It never sends `claimPlanet`, so an AI player that starts without a planet stays idle.
   - All AI players use the same strategy. Matches with mixed strategies are not covered.
7. **Stalemates.** In a one-hour 4-AI match (seed 1, `dominationPercent` 100) two players were eliminated and the other two held 565 and 432 planets until the timer. A long match can freeze. A mechanism to break it is not designed.
8. **Benchmark coverage.** All runs use one seed and one strategy. Add multi-seed runs and long matches (the one-hour match ran at about 3,000 ticks per second with 4 AI players).
9. **Real-time runner mode.** M4 built only fast mode. The catch-up cap per cycle (Section 10.1) is not defined and is decided in M5.
