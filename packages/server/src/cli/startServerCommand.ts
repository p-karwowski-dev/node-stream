import { parseArgs } from "node:util";
import type { MatchEndedEvent, PlayerId } from "@node-stream/shared";
import { createLobby } from "../adapters/lobby/index.js";
import type { LobbyHooks } from "../adapters/lobby/index.js";
import { createConnectionHub, createReconnectTokens, startNetworkServer } from "../adapters/network/index.js";
import type { NetworkServer } from "../adapters/network/index.js";
import { CliError } from "./cliError.js";
import { buildMatchConfig, resolveSeed } from "./configFile.js";
import { parseIntegerOption, parseOptions } from "./options.js";

const localHost = "127.0.0.1";
const defaultPort = 8080;
const minPort = 1;
const maxPort = 65535;
const noWinnerName = "none";

function resolvePort(value: string | undefined): number {
  const port = parseIntegerOption("port", value) ?? defaultPort;
  if (port < minPort || port > maxPort) {
    throw new CliError(`--port must be an integer from ${minPort} to ${maxPort}`);
  }
  return port;
}

function describeWinner(winnerId: PlayerId | null): string {
  return winnerId === null ? noWinnerName : `player ${winnerId}`;
}

const consoleHooks: LobbyHooks = {
  onMatchStarted: ({ players, planets, seed }) => {
    console.log(`match started: ${players} players, ${planets} planets, seed ${seed}`);
  },
  onMatchEnded: (lastTick: number, ending: MatchEndedEvent, commandLogEntries: number) => {
    console.log(
      `match ended at tick ${lastTick}: ${ending.reason}, winner ${describeWinner(ending.winnerId)}; command log: ${commandLogEntries} commands`,
    );
  },
  onLobbyReopened: () => {
    console.log("lobby reopened");
  },
};

async function listenOrFail(start: () => Promise<NetworkServer>, port: number): Promise<NetworkServer> {
  try {
    return await start();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new CliError(`Cannot listen on ${localHost}:${port}: ${reason}`);
  }
}

export async function startServerCommand(args: string[]): Promise<void> {
  const values = parseOptions(
    () =>
      parseArgs({
        args,
        options: { port: { type: "string" } },
        strict: true,
        allowPositionals: false,
      }).values,
  );
  const port = resolvePort(values.port);
  const seed = resolveSeed(undefined, undefined);
  const config = buildMatchConfig({}, seed);
  const hub = createConnectionHub();
  const lobby = createLobby({ config, outbox: hub, hooks: consoleHooks });
  const tokens = createReconnectTokens();
  const server = await listenOrFail(() => startNetworkServer({ host: localHost, port, hub, lobby, tokens }), port);
  console.log(`lobby open on ws://${localHost}:${server.port}, seed ${seed}`);
  process.once("SIGINT", () => {
    lobby.stop();
    void server.close().then(() => console.log("server stopped"));
  });
}
