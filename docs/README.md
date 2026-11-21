# node-stream

Space strategy game server. Design documents: `game-rules.md`, `game-design.md`, `game-ui.md`.

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
