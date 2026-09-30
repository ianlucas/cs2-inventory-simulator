/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { getTypedFromLocalStorage, setToLocalStorage } from "~/local-storage";

export function useStorageState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState(() =>
    getTypedFromLocalStorage(key, defaultValue)
  );

  useEffect(() => {
    setToLocalStorage(key, JSON.stringify(state));
  }, [state]);

  return [state, setState] as const;
}
