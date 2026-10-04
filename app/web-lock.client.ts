/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Waits in line for the lock and resolves with its release, or with
 * `undefined` when aborted first or when the browser cannot lock at all.
 */
export function requestWebLock(
  name: string,
  signal: AbortSignal
): Promise<(() => void) | undefined> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  if (locks === undefined) {
    return Promise.resolve(undefined);
  }
  return new Promise<(() => void) | undefined>((resolve) => {
    void locks
      .request(
        name,
        { signal },
        () =>
          new Promise<void>((release) => {
            resolve(() => release());
          })
      )
      .catch(() => resolve(undefined));
  });
}
