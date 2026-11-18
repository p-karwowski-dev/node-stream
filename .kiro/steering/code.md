# Code rules

These rules apply to all code in this project.

## Comments

1. Do not write comments in code files. This covers line comments, block comments, JSDoc and TODO notes.
2. Explain intent through names of files, modules, functions and types.
3. Documentation lives in the markdown documents in `docs/` (`game-rules.md`, `game-design.md`, `game-ui.md`), not in code. All project markdown files go in `docs/`. Steering files stay in `.kiro/steering/`.

## Structure

1. Code is modular and organised. Each module has one responsibility and a small public interface.
2. The simulation core is pure: no network, no timers, no file access and no wall-clock time. It takes a config, a seed and commands, and produces state and events.
3. Adapters (network, lobby, AI players, command-line runner) depend on the core. The core never depends on adapters.
4. Types and protocol messages shared by server and client live in the `shared` workspace.
5. Keep files small and focused. Split a file when it handles more than one concern.
6. Do not build features that the current documents do not ask for.

## Style

1. Language: TypeScript with strict mode on.
2. Use named exports. Avoid default exports.
3. Prefer small pure functions and immutable inputs. Mutate state only inside the module that owns it.
4. Use descriptive names. Avoid abbreviations, except common ones such as `id`.
5. Game parameters come from the config object. Do not hardcode values from `game-rules.md` Section 3.
6. Simulation randomness comes only from named seeded streams, created with `createStream(seed, name)`. Each purpose has its own stream (for example `world` and `aiClaims`). Code must not share a stream across purposes and must not use `Math.random`.

## Ignored files

1. Do not read, open or use `assets/mock Orbital Conquest.png`. Ignore it in all tasks, including reviews and design work.
2. Do not take requirements, names, numbers or layouts from it.
