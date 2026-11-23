import { MatchSetupError } from "../core/match/index.js";
import { benchmarkCommand } from "./benchmark/benchmarkCommand.js";
import { CliError } from "./cliError.js";
import { runMatchCommand } from "./runMatchCommand.js";
import { startServerCommand } from "./startServerCommand.js";
const commands = new Map<string, (args: string[]) => void | Promise<void>>([
  ["start-server", startServerCommand],
  ["run-match", runMatchCommand],
  ["benchmark", benchmarkCommand],
]);
const commandName = process.argv[2] ?? "";
const command = commands.get(commandName);
if (command === undefined) {
  console.error(
    `Unknown command. Use one of: ${[...commands.keys()].join(", ")}`
  );
  process.exitCode = 1;
} else {
  try {
    await command(process.argv.slice(3));
  } catch (error) {
    if (!(error instanceof CliError || error instanceof MatchSetupError)) {
      throw error;
    }
    console.error(error.message);
    process.exitCode = 1;
  }
}
