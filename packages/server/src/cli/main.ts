import type { PlayerId } from "@node-stream/shared";

const commandName = process.argv[2] ?? "";
const knownCommands = ["start-server", "run-match", "benchmark"];
const exampleId: PlayerId = 0;

if (!knownCommands.includes(commandName)) {
  console.error(`Unknown command. Use one of: ${knownCommands.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`${commandName} is not implemented yet (${exampleId})`);
}
