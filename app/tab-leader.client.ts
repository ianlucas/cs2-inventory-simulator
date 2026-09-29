/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

function holdForever(): Promise<never> {
  return new Promise<never>(() => {});
}

function waitForRelease(
  locks: LockManager,
  name: string,
  onGranted: () => void
): void {
  void locks
    .request(name, () => {
      onGranted();
      return holdForever();
    })
    .catch(() => {});
}

export function claimTabLock(
  name: string,
  { onGranted }: { onGranted?: () => void } = {}
): Promise<boolean> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  if (locks === undefined) {
    return Promise.resolve(false);
  }
  return new Promise<boolean>((resolve) => {
    void locks
      .request(name, { ifAvailable: true }, (lock) => {
        const granted = lock !== null;
        resolve(granted);
        if (granted) {
          return holdForever();
        }
        if (onGranted !== undefined) {
          waitForRelease(locks, name, onGranted);
        }
        return undefined;
      })
      .catch(() => resolve(false));
  });
}
