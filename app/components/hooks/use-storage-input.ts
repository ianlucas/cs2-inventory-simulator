/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect } from "react";
import { getFromLocalStorage, setToLocalStorage } from "~/local-storage";
import { useInput } from "./use-input";

export function useStorageInput(key: string, defaultValue: string) {
  const [state, setState] = useInput(getFromLocalStorage(key) || defaultValue);

  useEffect(() => {
    setToLocalStorage(key, state);
  }, [state]);

  return [state, setState] as const;
}
