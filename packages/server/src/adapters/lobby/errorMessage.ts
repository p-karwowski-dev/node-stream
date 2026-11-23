import type { ConfigError, ErrorCode, ErrorMessage } from "@node-stream/shared";

export function errorMessage(
  code: ErrorCode,
  message: string,
  configErrors: readonly ConfigError[] = [],
): ErrorMessage {
  return { type: "error", code, message, configErrors };
}
