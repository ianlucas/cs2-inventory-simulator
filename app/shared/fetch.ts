/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export async function postJson<T>(url: string, body: object) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  return (await response.json()) as T;
}

export async function getJson<T>(url: string) {
  const response = await fetch(url);
  return (await response.json()) as T;
}

// Messages browsers use when a request gets no response. Sentry appends the
// host to errors thrown by `fetch()`, e.g. "Failed to fetch (example.com)".
const NETWORK_ERROR_MESSAGES = [
  "Failed to fetch",
  "Load failed",
  "NetworkError when attempting to fetch resource."
];

export function isNetworkError(error: unknown) {
  return (
    error instanceof TypeError &&
    NETWORK_ERROR_MESSAGES.some((message) => error.message.startsWith(message))
  );
}
