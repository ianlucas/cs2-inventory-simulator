/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";

export function useTimedState(duration = 1000) {
  const [active, setActive] = useState<number>();
  useEffect(() => {
    if (active !== undefined) {
      const timeout = setTimeout(() => {
        setActive(undefined);
      }, duration);
      return () => clearTimeout(timeout);
    }
  }, [active, duration]);
  return [active !== undefined, () => setActive(Date.now())] as const;
}
