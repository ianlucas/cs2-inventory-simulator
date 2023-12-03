/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useWindowScroll } from "@uidotdev/usehooks";
import { useEffect, useState } from "react";

export function useIsOnTop() {
  if (typeof document === "undefined") {
    return false;
  }
  const [isOnTop, setIsOnTop] = useState(false);
  const [{ y }] = useWindowScroll();

  useEffect(() => {
    setIsOnTop(y === 0);
  }, [y]);

  return isOnTop;
}
