/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useWindowSize } from "@uidotdev/usehooks";

export function useIsDesktop() {
  if (typeof document === "undefined") {
    return false;
  }
  const { width } = useWindowSize();
  if (width === null) {
    return false;
  }
  return width > 1024;
}
