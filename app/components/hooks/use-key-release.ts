/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect } from "react";

export function useKeyRelease(targetKey: string, callback: () => void) {
  function handleKeyUp({ key }: KeyboardEvent) {
    if (key === targetKey) {
      callback();
    }
  }
  useEffect(() => {
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [targetKey, callback]);
}
