import type { ConfigError } from "@node-stream/shared";
export type MatchSetupErrorReason = "invalidConfig" | "emptyWorld";
function describe(reason: MatchSetupErrorReason, configErrors: readonly ConfigError[]): string {
  if (reason === "emptyWorld") {
    return "The generated world has no planets";
  }
  const details = configErrors.map((error) => `${error.parameter} ${error.message}`).join("; ");
  return `Invalid config: ${details}`;
}
export class MatchSetupError extends Error {
  readonly reason: MatchSetupErrorReason;
  readonly configErrors: readonly ConfigError[];
  constructor(reason: MatchSetupErrorReason, configErrors: readonly ConfigError[] = []) {
    super(describe(reason, configErrors));
    this.name = "MatchSetupError";
    this.reason = reason;
    this.configErrors = configErrors;
  }
}
