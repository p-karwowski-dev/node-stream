# Space Strategy Game: Rules and Gameplay Specification

**Version:** 2.2
**Scope:** Game concept, rules and the game loop. The lobby and UI are described in `game-ui.md`. Technical decisions are described in `game-design.md`.

**Parameters and rules:** Every parameter is configurable (see Section 3). The rules in this document are hardcoded and are not configurable.

## 1. Game overview

Players compete in a three-dimensional space full of planets. Each player starts on one planet and builds directed links from the planets they own to other planets. Owned planets produce spaceships. Ships travel along the links one hop at a time. On arrival a ship fights, captures a planet, reinforces a planet, or moves on.

A match ends when one player controls enough planets (domination), when every player is eliminated, or when the timer runs out.

Main loop:

1. Each player picks a starting planet.
2. Players create links from planets they own.
3. Owned planets produce ships.
4. Ships travel along links and are sent onward by each planet they reach. A planet without outgoing links keeps its ships as reinforcement.
5. Ships fight on planets. Planets are captured, lost or reinforced.
6. The match ends by domination, by elimination of all players, or by timer.

## 2. Definitions

| Term                         | Meaning                                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Planet**                   | A point in space with an owner, current points, max points and links.                                                                                 |
| **Player-owned**             | Owned by a player, with at least 1 point.                                                                                                             |
| **Rogue**                    | Unowned, with at least 1 point. A rogue planet does not produce ships and does not regain points.                                                     |
| **Neutral**                  | Unowned, with 0 points. The next ship to arrive captures it. A neutral planet does not produce ships.                                                 |
| **Link**                     | A directed connection `A → B`. Ships can travel from A to B only. Two planets of the same owner can be linked in one direction at a time (Section 8). |
| **Active link**              | A link that has not been removed.                                                                                                                     |
| **Link length**              | The straight-line distance between the centres of the two planets.                                                                                    |
| **Outgoing / incoming link** | `A → B` is outgoing for A and incoming for B. Only outgoing links are used for routing.                                                               |
| **Hop**                      | One ship journey along one link. A longer trip is a series of hops.                                                                                   |
| **Fleet**                    | All ships of one player that are on one planet (arrived, waiting, or just produced).                                                                  |
| **Tick**                     | One step of the game loop (see Section 5).                                                                                                            |
| **Link owner**               | The owner of the link's source planet.                                                                                                                |

Planet colours: the owner sees their own planets with a green glow and enemy planets with a red glow. Rogue and neutral planets use the same neutral colour. Spectators see the same colours.

## 3. Parameters

All values can be changed in the config. Defaults are shown.

| Parameter                             |      Default | Meaning                                                                                            |
| ------------------------------------- | -----------: | -------------------------------------------------------------------------------------------------- |
| `maxPlayers`                          |           20 | Maximum number of players in a match.                                                              |
| `matchDurationSeconds`                |          300 | Match length.                                                                                      |
| `dominationPercent`                   |           30 | Share of planets that wins the match.                                                              |
| `planetDistribution`                  | `[10,10,10]` | Grid: planets per axis `[x,y,z]`. Random: a single integer (planet count). `null` is not accepted. |
| `minPlanetDistance`                   |          200 | Minimum distance between two planets (units).                                                      |
| `minReachablePlanets`                 |            0 | Minimum number of planets within `maxHopDistance` of every planet.                                 |
| `mapScale`                            |            1 | Multiplier for the map size. Must be 1 or more. Mainly used in random mode (Section 4).            |
| `maxHopDistance`                      |          400 | Maximum link length and maximum length of one hop (units).                                         |
| `initialShipSpeed`                    |          200 | Ship speed on the first hop (units per second).                                                    |
| `speedDecayPercent`                   |           10 | Speed lost after each completed hop, as a percentage of the initial speed.                         |
| `hopDelayTicks`                       |            0 | Ticks a ship waits at a planet between arriving and departing.                                     |
| `tickLengthMs`                        |          100 | Length of one tick.                                                                                |
| `productionIntervalTicks`             |           10 | Ticks between production rounds (10 ticks of 100 ms = 1 second).                                   |
| `shipsPerProduction`                  |            1 | Ships produced by each owned planet per production round.                                          |
| `planetPointsMin` / `planetPointsMax` |       1 / 50 | Range of random starting points of a planet.                                                       |
| `attackDamagePerShip`                 |            1 | Points a surviving attacking ship removes from a planet.                                           |
| `reinforcementPerShip`                |            1 | Points a surviving owner ship adds to its planet.                                                  |
| `capturePoints`                       |            1 | Points a planet has right after it is captured.                                                    |
| `seed`                                |       random | Seed for the world generator.                                                                      |
| `unitToPixel`                         |           10 | UI only. 1 unit = 10 pixels.                                                                       |

### 3.1 Parameter validation

A config that breaks any of these constraints is rejected:

1. `maxPlayers` ≥ 1.
2. `matchDurationSeconds` > 0.
3. `dominationPercent` > 0 and ≤ 100.
4. `planetDistribution`: grid values are integers ≥ 1; random value is an integer ≥ 1.
5. `minPlanetDistance` > 0 and `minPlanetDistance` ≤ `maxHopDistance` (otherwise no link is possible).
6. `minReachablePlanets` is an integer ≥ 0.
7. `mapScale` ≥ 1.
8. `initialShipSpeed` > 0.
9. `speedDecayPercent` ≥ 0. A value of 0 means ships never lose speed and can hop without limit.
10. `hopDelayTicks` is an integer ≥ 0.
11. `tickLengthMs` > 0.
12. `productionIntervalTicks` is an integer ≥ 1.
13. `shipsPerProduction` is an integer ≥ 1.
14. `planetPointsMin` ≥ 1 and `planetPointsMin` ≤ `planetPointsMax`.
15. `attackDamagePerShip`, `reinforcementPerShip` and `capturePoints` are integers ≥ 1.

## 4. World and generator

1. The world is a cube. Its side is a base size multiplied by `mapScale`.
   - Grid: base size = largest axis count × `minPlanetDistance`.
   - Random: base size = the cube root of the planet count, rounded up, × `minPlanetDistance`.
2. **Grid mode:** `planetDistribution` is `[x,y,z]`. Planets are spread evenly over the cube with the given counts per axis. The spacing on an axis is `side / n`, where `n` is the count on that axis.
3. **Random mode:** `planetDistribution` is one integer. Planets are placed at random positions in the cube, using `seed`. With `mapScale` 1 the cube is as dense as a grid, so many random positions break rule 4 and are removed. Raise `mapScale` in random mode to keep the final planet count close to the requested count.
4. No two planets may be closer than `minPlanetDistance`.
5. Every planet must have at least `minReachablePlanets` other planets within `maxHopDistance`.
6. After the first placement, the generator removes every planet that breaks rule 4 or 5, and repeats until no planet breaks a rule. The final planet count can be lower than the requested count.
7. The final planet count is used for the domination check.
8. Every planet starts as **rogue** with random integer points from `planetPointsMin` to `planetPointsMax`. Its **max points** equal these starting points and never change.
9. Players choose their starting planet. The planet keeps its points and its max points. How starting planets are picked is described in `game-ui.md`.

## 5. Game loop

The game runs in ticks of `tickLengthMs`. Ticks are numbered from 1. Tick `n` covers match time up to `n × tickLengthMs`.

**Player actions.** Link creation and removal requested during a tick are applied at the start of the next tick, before movement, in the order they were received. Each action is checked against Section 8 when it is applied. An action that is no longer valid at that moment (for example, the player no longer owns the source planet) is dropped.

Each tick runs these steps in order:

```mermaid
flowchart LR
  A[Movement and arrivals] --> B[Production]
  B --> C[Ship-to-ship battle]
  C --> D[Ship-to-planet battle]
  D --> E[Dispatch / reinforce]
  E --> F[Elimination and win checks]
```

1. **Movement and arrivals.** Ships move in straight lines. Ships whose arrival time has been reached arrive at their destination planet and join that planet's fleet for their player.
2. **Production.** On every production round (every `productionIntervalTicks`), each player-owned planet produces `shipsPerProduction` ships for its owner, whether or not it has outgoing links. Produced ships join the owner's fleet on that planet.
3. **Ship-to-ship battle.** Fleets of different players on the same planet fight (Section 7.1).
4. **Ship-to-planet battle.** A surviving fleet that does not own the planet attacks it (Section 7.2).
5. **Dispatch / reinforce.** Surviving fleets of the planet's owner are sent onward, or reinforce the planet (Section 7.3).
6. **Elimination and win checks.** See Section 9.

Ships pass through each other in open space. Fights happen only on planets.

## 6. Production, routing and ship speed

### 6.1 Production

1. Production runs on a global schedule: on every tick whose number is a multiple of `productionIntervalTicks`. The first production round is on tick `productionIntervalTicks`. A planet captured between rounds waits for the next production round.
2. Every player-owned planet produces, with or without outgoing links. Rogue and neutral planets produce nothing.
3. New ships belong to the planet's owner, start with `initialShipSpeed`, and join that tick's battles.
4. Produced ships that survive the battles are dispatched if the planet has active outgoing links. If it has none, they reinforce the planet (Section 7.3).
5. The production limit applies only to new ships. Arriving ships that continue are not limited.

### 6.2 Round-robin routing

1. Each planet keeps an ordered list of its active outgoing links. A new link is added to the end of the list. A removed link is taken out of the list.
2. Each planet has one **cursor**: the index of the last used outgoing link. Before the first departure the cursor is −1.
3. The same cursor is used for newly produced ships and for arriving ships that continue.
4. For each departing ship the target index is `cursor + 1`. If this index is equal to or greater than the list length, the target index is 0. The ship departs on the link at the target index and the cursor becomes the target index.
5. When a link is removed and its index is lower than or equal to the cursor, the cursor is reduced by 1.
6. When the planet's owner changes, the cursor is reset to −1.
7. If the list is empty, the dispatch logic is skipped and no ship departs (Section 7.3).
8. Ships leave a planet in fleet order (Section 7.4).

**Example.** Links: `A → D`, `B → D`, `D → E`, `D → F`. D's outgoing list is `[E, F]` and the last ship went to E (cursor 0). In one tick D produces 1 ship and 2 friendly ships arrive and continue (with `hopDelayTicks` 0). The three ships depart in order to `F` (index 1), `E` (index 2 → 0), `F` (index 1). The incoming links from A and B do not affect routing.

### 6.3 Hop delay

1. A ship that arrives at a planet where it will continue departs `hopDelayTicks` ticks later. With the default of 0 it departs in the same tick. Newly produced ships are not delayed and are handled in the tick they are produced.
2. While waiting, a ship belongs to its player's fleet on that planet and takes part in battles.
3. When the delay ends, the ship is handled by Section 7.3: it departs if the planet has active outgoing links, or it reinforces the planet if it has none. The destination is chosen at departure, using the cursor at that moment.

### 6.4 Speed and hop time

1. A ship starts with `initialShipSpeed`.
2. After each completed hop, the ship loses `speedDecayPercent` of the initial speed. This is a fixed amount (20 units per second with the defaults), not a percentage of the current speed.
3. A departure is timestamped with the current time when the tick loop reaches the dispatch phase. Arrival time = departure timestamp + link length ÷ current speed. The ship arrives in the first tick whose movement phase time is at or after the arrival time.
4. A ship whose speed is 0 or less cannot start another hop.
5. There is no separate hop limit. With the defaults, the speed decay allows 10 hops.
6. A ship with no speed left still fights when it arrives. If it survives in the owner's fleet, it reinforces the planet when the planet has no active outgoing links, and is removed when the planet has active outgoing links.

## 7. Combat

### 7.1 Ship-to-ship battle

Applies when ships of two or more players are on the same planet in the same tick. This includes the planet's owner. A planet with a fleet of only one player has no ship-to-ship battle.

1. Ships of the same player on the planet form one fleet.
2. The largest fleet loses ships equal to the size of the second-largest fleet.
3. All other fleets are destroyed.
4. If the two largest fleets are the same size, every fleet is destroyed.

**Example.** A has 10 ships, B has 11 and C has 16. C loses 11 and 5 ships of C remain. A and B are destroyed.

**Example.** Two ships from different players arrive at a neutral planet in the same tick. They destroy each other and the planet stays neutral.

### 7.2 Ship-to-planet battle

Applies to a surviving fleet that does not own the planet (the planet is rogue, neutral or owned by someone else).

1. Each ship removes `attackDamagePerShip` points from the planet. Ships used up this way are removed.
2. If the planet still has points, it keeps its owner and the fleet is gone.
3. If the planet reaches 0 points, it becomes **neutral**: its owner is cleared and every link owned by the old owner that touches this planet is removed (Section 8.7).
4. If ships are left over, one of them **captures** the planet. The planet gets `capturePoints` points (not above max points) and the fleet's owner becomes the planet's owner.
5. Any further left-over ships reinforce the planet by `reinforcementPerShip` each, up to max points. Ships beyond max points are destroyed and have no effect on the planet.
6. A neutral planet has no points to remove, so the first ship captures it and the rest reinforce it.
7. If no ships are left over, the planet stays neutral until a later ship arrives.

**Example.** A fleet of 5 hits a rogue planet with 2 points. Two ships bring it to 0. One of the remaining 3 ships captures it (1 point) and the other 2 reinforce it (3 points, limited by max points).

### 7.3 Owner's fleet: dispatch or reinforce

A surviving fleet that owns the planet (arrived, waiting ships whose delay has ended, and produced ships):

1. If the planet has active outgoing links, its ships are sent out by round-robin (Section 6.2), after any hop delay. A ship with no speed left is removed instead (Section 6.4).
2. If the planet has no active outgoing links, each ship adds `reinforcementPerShip` points, up to max points. This includes ships with no speed left. Ships beyond max points are destroyed and have no effect on the planet.

### 7.4 Fleet order

A fleet is an ordered list. Arriving ships and produced ships are added to the end, ordered by arrival time (production time for produced ships) and then by ship ID. Ships lost in battle are taken from the front. Ships that depart are also taken from the front.

### 7.5 Planet points

Planet points never go below 0 or above max points. Max points never change, including after the planet is weakened, made neutral or captured.

## 8. Links and ownership

1. A player can create a link only from a planet they own.
2. A link can go to any other planet (owned, enemy, rogue or neutral), if its length is at most `maxHopDistance`.
3. Links are unique: `A → B` can exist only once. There is no limit on the number of outgoing links per planet other than the planets within `maxHopDistance`.
4. Creating `A → B` does not create `B → A`. If A and B have the same owner, `A → B` exists and `B → A` is created, `A → B` is removed and `B → A` takes its place. If A and B have different owners, both links can exist at the same time.
5. Only the owner of the source planet can remove its outgoing link.
6. Removing a link does not stop ships already travelling on it. They finish that hop.
7. When a player-owned planet becomes neutral, only the links owned by the old owner are removed: all its outgoing links, and its incoming links that start on the old owner's planets. Incoming links from other players stay. A rogue planet that becomes neutral has no old owner, so no link is removed. Ships already travelling finish their hop.
8. A captured planet always passes through neutral (Section 7.2), so the same rule applies. Incoming links of the capturing player stay, so the attacker keeps its route to the planet.
9. A ship arriving at a planet is judged by the planet's state at the moment of arrival, not by its state when the hop began. A planet that has changed owner does not route the ship. The ship fights, captures or reinforces according to Section 7.

## 9. Winning and elimination

Checks run at the end of every tick, in this order.

### 9.1 Elimination

A player is eliminated for good, and becomes a spectator, only when they own 0 planets and have 0 ships. Ships include ships in flight and ships waiting for their next hop. A player with no planets but with ships left is still in the match. A ship of theirs that captures a neutral planet gives them a planet again.

If every player is eliminated, the match ends immediately as a draw.

### 9.2 Domination

A player who owns at least the domination threshold wins immediately. The threshold is `dominationPercent` of the final planet count, rounded down, with a minimum of 2 planets. Example: 30% of 997 planets is 299.1, so 299 planets are needed. 30% of 5 planets is 1.5, so 2 planets are needed. If the map has fewer than 2 planets, the match can end only by timer or elimination.

### 9.3 Timer

The match ends at the end of the first tick after `matchDurationSeconds` has passed: the first tick `n` with `n × tickLengthMs` > `matchDurationSeconds × 1000`. The player with the most planets wins. With the defaults the last tick is 3001.

### 9.4 Tie-break

If two or more players are level on the same check (including two players reaching domination in the same tick), the winner is decided in this order:

1. Most planets.
2. Highest total current planet points.
3. Highest total max planet points of their planets.
4. Most ships (ships in flight plus ships waiting for their next hop).

If all four are equal, the match is a draw.

### 9.5 No early end

The match does not end when only one player remains. That player keeps playing until domination or the timer. A match with a single player is allowed.

## 10. Players and connections

1. The host starts the match. No player can join after it has started. There is no minimum number of players.
2. Players cannot create or send ships by hand. Production, routing, movement, battles, captures and reinforcements are automatic.
3. Players can select and inspect any planet or ship. All information is visible to all players.
4. Players can create links and remove links (Section 8).
5. The match cannot be paused, by the host or by any player.
6. If a player disconnects, their planets keep running. The player can reconnect and regain control.

## 11. Open items

1. How starting planets are picked and how two players choosing the same planet are handled. To be defined in `game-ui.md`.
2. The generator algorithm, including the case where removals leave fewer planets than players, and the technical details of the game loop. To be defined in `game-design.md`.
3. How ship IDs are assigned (see Section 7.4).
