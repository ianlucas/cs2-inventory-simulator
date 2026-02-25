/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect } from "react";
import { UnlockCaseEventData, app } from "~/app";

export function useListenAppEvent(
  name: "unlockcase",
  callback: (payload: UnlockCaseEventData) => void
): void;
export function useListenAppEvent<T extends object>(
  name: string,
  callback: (payload: T) => void
) {
  function listener(event: Event) {
    callback((event as CustomEvent).detail);
  }
  useEffect(() => {
    app.addEventListener(name, listener);
    return () => app.removeEventListener(name, listener);
  }, []);
}
