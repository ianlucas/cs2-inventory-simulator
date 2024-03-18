/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useRef } from "react";

export function useWatch<T>(
  callback: (oldState: T, newState: T) => void,
  dependency: T
) {
  const oldStateRef = useRef(dependency);

  useEffect(() => {
    callback(oldStateRef.current, dependency);
    oldStateRef.current = dependency;
  }, [dependency, callback]);
}
