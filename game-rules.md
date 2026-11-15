# Space Strategy Game — Rules and Gameplay Specification

**Version:** 1.0  
**Status:** Core rules updated from the latest gameplay clarifications  

## 1. Game overview

The game takes place in a three-dimensional space containing **1,000 randomly distributed planets (10 × 10 × 10)**.

Players select a starting planet and compete to control planets by creating directed connections between them. Owned planets automatically produce spaceships. Spaceships travel along connections one hop at a time, attack unowned or enemy planets, capture neutral planets, and reinforce friendly planets.

The main gameplay loop is:

1. Select and claim a starting planet.
2. Create directed connections from owned planets to other planets.
3. Owned planets produce spaceships automatically.
4. Spaceships travel along individual connections (hops).
5. On arrival, a spaceship attacks, captures, reinforces, or continues its journey according to the destination planet's current state.
6. Players create and remove connections to influence where their spaceships travel.

## 2. Definitions

### 2.1 Planet ownership and status

A planet has an owner, a current point value, and a maximum point value.

| Planet state | Owner | Points | Meaning |
|---|---|---:|---|
| **Player-owned** | A player ID | 1 or more | Controlled by that player. |
| **Enemy-owned** | Another player's ID (from the observing player's perspective) | 1 or more | Controlled by an opponent. |
| **Rogue** | None (`null`) | 1 or more | An unowned planet with points remaining. Rogue planets can be weakened before they are captured. |
| **Neutral** | None (`null`) | 0 | An unowned planet with no points. The next spaceship to arrive captures it. |

Rogue and neutral planets are both unowned and use the neutral visual appearance. Their gameplay distinction is their point value: a rogue planet has at least one point; a neutral planet has zero points.

### 2.2 Links and direction

A **link** is a directed connection from one planet to another.

For a link `A → B`:

- Planet A has an **outgoing** link to B.
- Planet B has an **incoming** link from A.
- Ships may travel from A to B using this link.
- The link does not allow travel from B to A. A separate `B → A` link is required for travel in the opposite direction.

### 2.3 Hop

A **hop** is one spaceship journey along one directed link, from its source planet to that link's destination planet. A longer journey consists of multiple hops, with the next hop selected only when the spaceship reaches an intermediate planet.

## 3. Initial world and starting planets

1. The initial world contains **1,000 planets** distributed randomly in three-dimensional space (10 × 10 × 10).
2. Every planet initially spawns as a **rogue planet**.
3. Each rogue planet is assigned a random integer point value from **1 to 50**, inclusive.
4. A planet's initial point value also defines its **maximum points**. For example, a planet spawned with 24 points has 24 current points and a maximum of 24 points.
5. At the beginning of the game, each player selects a rogue planet and confirms it as their starting planet.
6. The confirmed starting planet becomes owned by that player. Its randomly assigned points and maximum points are not changed by the claim under the current specification.

## 4. Planet points, ownership and appearance

1. A planet's points cannot fall below zero or exceed its maximum points.
2. Player-owned planets are displayed with a **green glow** for their owner.
3. Enemy-owned planets are displayed with a **red glow** to an observing player.
4. Rogue and neutral planets use the **neutral colour** and have no player ownership glow.
5. When a rogue or owned planet's points reach zero, it immediately becomes neutral: its owner is set to `null` and its points remain zero.
6. When a planet becomes neutral at zero points, all of its incoming and outgoing links are removed immediately.
7. A neutral planet is captured by the next spaceship that arrives. The new owner is the spaceship's owner, and the planet starts with **1 point**.
8. A planet's maximum points remain the value assigned when it spawned, including after it is weakened, neutralised, or captured.

## 5. Creating and removing links

1. A player may create an outgoing link from a planet they own to another planet, provided the distance between the two planets is no greater than **2,000 world units**.
2. Creating `A → B` adds an outgoing link to A and an incoming link to B. It does not create a return link.
3. Only the source planet's owner may create or remove one of that planet's outgoing links.
4. A link's travel distance is the distance between its two planets.
5. Removing a link prevents it from being selected for future hops.
6. Removing a link does **not** cancel a spaceship that has already started travelling along that link. That spaceship completes its current hop.
7. When a planet becomes neutral at zero points, all its incoming and outgoing links are removed immediately. This does not cancel hops that have already started; affected spaceships complete their current hop and are then evaluated against the destination planet's current state.
8. When a planet is captured, its incoming and outgoing links are removed. In the normal capture flow, these links will already have been removed when the planet became neutral.

## 6. Spaceship production

1. An owned planet with at least one active outgoing link produces **one new spaceship per 1-second production tick**.
2. A planet produces no new spaceship while it has no active outgoing links.
3. The one-ship-per-tick limit applies to **new production only**. It does not limit spaceships arriving at the planet and continuing onward; each eligible incoming spaceship continues independently.
4. A newly produced spaceship belongs to the player who owns the producing planet.
5. A newly produced spaceship starts with an initial speed of **1,000 world units per second**.
6. The planet selects the spaceship's first destination using its round-robin route selection (see Section 7).

## 7. Round-robin route selection

Each planet maintains one shared round-robin selection position for its **outgoing links**.

The same selection position is used for:

- New spaceships produced by the planet.
- Incoming friendly spaceships that reach the planet and continue to another planet.

Only active outgoing links are included in the selection. Incoming links never form part of the route-selection list.

### Example

The links are:

- `A → D`
- `B → D`
- `D → E`
- `D → F`

Therefore:

| Planet | Incoming links | Outgoing links |
|---|---|---|
| A | — | D |
| B | — | D |
| D | A, B | E, F |
| E | D | — |
| F | D | — |

Suppose D's last dispatched spaceship was sent to E. D's outgoing selection order is `[E, F]`, so the next destination is F.

If, during the relevant processing period, D produces one new spaceship and receives two friendly spaceships that must continue, the three dispatches consume the shared round-robin sequence:

1. F
2. E
3. F

The incoming links `[A, B]` do not affect this selection. All three departures are distributed across D's outgoing links `[E, F]`.

When a link is removed, it is skipped by future selections. The round-robin selection must continue over the remaining active outgoing links. If no active outgoing links remain, no next hop can be selected.

## 8. Spaceship speed and hop duration

### 8.1 Initial speed and speed reduction

- Initial spaceship speed: **1,000 world units per second**.
- After each completed hop, the spaceship loses **10% of its initial speed**, i.e. 100 units per second.
- The reduction is a fixed amount based on the initial speed; it is not 10% of the speed remaining at that point.
- The reduced speed is used for the next hop.

| Hop | Speed used during hop | Speed after hop completes |
|---:|---:|---:|
| 1 | 1,000 | 900 |
| 2 | 900 | 800 |
| 3 | 800 | 700 |
| 4 | 700 | 600 |
| 5 | 600 | 500 |
| 6 | 500 | 400 |
| 7 | 400 | 300 |
| 8 | 300 | 200 |
| 9 | 200 | 100 |
| 10 | 100 | 0 |

A spaceship can complete at most ten hops. Once its speed reaches zero, it cannot start another hop and is removed if another hop would be required.

### 8.2 Travel time

Each hop's travel time is calculated using that hop's distance and the spaceship's current speed:

`hop travel time = link distance / current spaceship speed`

For example, a 2,000-unit link takes 2 seconds at 1,000 units/second, or 4 seconds at 500 units/second.

The maximum permitted link distance is **2,000 world units**. The 10ms pause previously considered between hops is **not part of the rules**; a continuing spaceship starts its next hop without that additional pause.

### 8.3 Movement behaviour

1. A spaceship travels in a straight line from the source planet to the destination planet of its current hop.
2. A spaceship only needs a destination for its next hop; it does not have a fixed complete route to a final destination.
3. The destination planet determines the next hop when the spaceship arrives, if continuation is allowed.
4. A spaceship may revisit planets and travel around cycles, provided it still has speed to start another hop.
5. Spaceships do not collide with one another and may pass through one another.

## 9. What happens when a spaceship arrives?

The destination planet's **current** ownership and point state are evaluated when the spaceship arrives. The result may differ from what the client expected when the spaceship began its hop, because ownership and links can change during flight.

### 9.1 Arrival at an enemy-owned planet

1. The spaceship subtracts **1 point** from the planet.
2. The spaceship is destroyed upon contact and is removed.
3. If the planet still has points remaining, it retains its current owner.
4. If the planet reaches zero points, it immediately becomes neutral and all incoming and outgoing links are removed.
5. The spaceship that reduces the planet to zero is destroyed; it does not capture the planet.
6. The next spaceship to arrive at the now-neutral planet captures it (see Section 9.3).

### 9.2 Arrival at a rogue planet

1. A rogue planet has no owner but has at least one point.
2. An arriving spaceship subtracts **1 point** from the rogue planet and is destroyed.
3. If the points reach zero, the planet becomes neutral and all incoming and outgoing links are removed.
4. The next spaceship to arrive captures the neutral planet, regardless of which player owns that spaceship.

### 9.3 Arrival at a neutral planet

1. A neutral planet has no owner and zero points.
2. The arriving spaceship captures it, regardless of which player previously owned it (if any).
3. The planet's owner becomes the spaceship's owner.
4. The planet's points become **1**; its maximum points remain unchanged.
5. The capturing spaceship is removed.

### 9.4 Arrival at a friendly planet with active outgoing links

1. The planet selects the next destination from its active outgoing links using its shared round-robin selection position.
2. The arriving spaceship continues along the selected link without an additional 10ms pause.
3. Its next-hop speed is the speed remaining after the completed hop's 100-units-per-second reduction.
4. If its speed has reached zero, it cannot start another hop and is removed. It does not receive a terminal-planet reinforcement at this intermediate planet.

### 9.5 Arrival at a friendly planet with no active outgoing links

1. The spaceship adds **1 point** to the planet.
2. The planet's points are capped at its maximum points.
3. If the planet is already at maximum points, its points do not change.
4. The spaceship is removed after this arrival.

## 10. Ships in flight when links or ownership change

1. Removing a link does not cancel a spaceship already travelling along that link.
2. When a planet becomes neutral, its incoming and outgoing links are removed immediately.
3. Spaceships already travelling towards that planet continue to the planet.
4. Spaceships that already departed from that planet also complete the hop they had started, even if the planet's links are subsequently removed or its ownership changes.
5. On arrival, each spaceship is evaluated using the destination planet's current ownership, points and active outgoing links. It does not rely on the planet's state from the time the hop began.
6. A removed link cannot be selected for a new hop.

## 11. Player actions

Players can:

1. **Select a starting planet:** Choose a rogue planet at the beginning of the game and confirm it as their starting planet.
2. **Select and inspect a planet:** View its owner, current points, maximum points, incoming links and outgoing links.
3. **Create a link:** Create a directed outgoing link from an owned planet to another planet within the 2,000-unit maximum distance.
4. **Remove a link:** Remove an outgoing link from a planet the player owns.
5. **Inspect a spaceship:** View its owner, current hop (source and next destination), current speed and journey progress.

Players do not manually create or dispatch spaceships. Production, route selection, movement, attacks, captures, reinforcements and spaceship removal happen automatically according to the rules above.

## 12. Initial game parameters

| Parameter | Initial value |
|---|---:|
| Number of planets | 1,000 |
| Planet count representation | 10 × 10 × 10 = 1,000 planets |
| Initial planet state | Rogue |
| Initial rogue planet points | Random integer from 1 to 50 |
| Maximum planet points | Equal to that planet's initial random points |
| Initial spaceship speed | 1,000 world units/second |
| Speed reduction per completed hop | 100 world units/second (10% of initial speed) |
| Maximum link distance | 2,000 world units |
| Planet production interval | 1 second |
| New ships per producing planet per production tick | 1 |
| Attack damage per spaceship | 1 point |
| Reinforcement per spaceship at a friendly terminal planet | 1 point, subject to maximum |
| Delay between hops | None |

## 13. Rules not yet fully specified

The following details are not defined by the confirmed rules and should be decided before they are hard-coded:

1. **Starting-planet exclusivity:** Can two players select the same rogue planet during the starting phase, or must each starting planet be unique? A likely rule is that a confirmed starting planet becomes unavailable to other players.
2. **Starting-planet points:** This document assumes that claiming a starting rogue planet changes only its owner; its randomly assigned current points and maximum points remain unchanged. Confirm if claiming should instead set or modify its points.
3. **Outgoing-link order:** Round-robin selection needs a stable order for a planet's active outgoing links (for example, link creation order). The example uses `[E, F]`, but the general ordering rule has not been specified.
4. **Simultaneous dispatch ordering:** If a production tick and multiple incoming arrivals trigger departures from the same planet at the same simulation time, the shared cursor must be advanced in a deterministic order. The rule that all departures share the cursor is confirmed; the tie-breaking order between simultaneous triggers is not.
5. **First production time:** It is specified that production occurs every second, but not whether a planet's first production occurs immediately when it becomes owned/gets its first outgoing link or at the next global production tick.
6. **Victory and match-end conditions:** The objective and condition for winning or ending a match have not yet been defined.
7. **World dimensions and placement constraints:** The 10 × 10 × 10 notation describes the 1,000-planet count. The physical coordinate bounds, planet radii, and any minimum separation between spawned planets have not been specified.

---

**End of gameplay rules.** Architecture, networking protocols, persistence, server scaling and performance optimisation are intentionally outside the scope of this document.
