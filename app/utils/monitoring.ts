/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { captureException, type SeverityLevel } from "@sentry/core";

interface LogDetails {
  error?: unknown;
  extra?: Record<string, unknown>;
}

export function logError(message: string, details?: LogDetails) {
  console.error(message, ...toConsoleArgs(details));
  report("error", message, details, logError);
}

export function logWarning(message: string, details?: LogDetails) {
  console.warn(message, ...toConsoleArgs(details));
  report("warning", message, details, logWarning);
}

function toConsoleArgs({ error, extra }: LogDetails = {}) {
  return [
    ...(extra !== undefined ? [extra] : []),
    ...(error !== undefined ? [error] : [])
  ];
}

function report(
  level: SeverityLevel,
  message: string,
  { error, extra }: LogDetails = {},
  caller: (...args: never[]) => void
) {
  const reported = new Error(
    message,
    error !== undefined ? { cause: error } : undefined
  );
  Error.captureStackTrace?.(reported, caller);
  captureException(reported, { extra, level });
}
