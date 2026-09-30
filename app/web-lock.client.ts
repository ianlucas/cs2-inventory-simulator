/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

function holdForever(): Promise<never> {
  return new Promise<never>(() => {});
}

export function holdWebLock(name: string): Promise<boolean> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  if (locks === undefined) {
    return Promise.resolve(false);
  }
  return new Promise<boolean>((resolve) => {
    void locks
      .request(name, { ifAvailable: true }, (lock) => {
        const granted = lock !== null;
        resolve(granted);
        return granted ? holdForever() : undefined;
      })
      .catch(() => resolve(false));
  });
}
