/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect } from "react";
import { useInput } from "./use-input";

export function useStorageInput(key: string, defaultValue: string) {
  const [state, setState] = useInput(
    typeof window === "undefined"
      ? defaultValue
      : window.localStorage.getItem(key) || defaultValue
  );

  useEffect(() => {
    window.localStorage.setItem(key, state);
  }, [state]);

  return [state, setState] as const;
}
