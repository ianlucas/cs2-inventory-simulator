/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";

export function useIsOnTop() {
  const [isSticky, setIsSticky] = useState(false);
  if (typeof document === "undefined") {
    return false;
  }
  useEffect(() => {
    function handleScroll() {
      setIsSticky(window.scrollY === 0);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });
  return isSticky;
}
