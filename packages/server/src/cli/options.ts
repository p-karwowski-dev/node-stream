import { CliError } from "./cliError.js";
const integerPattern = /^-?\d+$/;
export function parseOptions<T>(parse: () => T): T {
  try {
    return parse();
  } catch (error) {
    throw new CliError(error instanceof Error ? error.message : String(error));
  }
}
export function parseIntegerOption(name: string, value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!integerPattern.test(value) || !Number.isSafeInteger(parsed)) {
    throw new CliError(`--${name} must be an integer`);
  }
  return parsed;
}
