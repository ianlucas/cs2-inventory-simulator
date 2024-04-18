/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useWindowSize } from "@uidotdev/usehooks";
import { useEffect, useState } from "react";

function getRatio(width: number) {
  if (width >= 1920) {
    return 1;
  }
  if (width <= 360) {
    return 0.7;
  }
  const slope = (1 - 0.7) / (1920 - 360);
  const intercept = 1 - slope * 1920;
  return slope * width + intercept;
}

export function useResponsiveScale() {
  const [scale, setScale] = useState(1);
  const size = useWindowSize();

  useEffect(() => {
    if (size.width) {
      setScale(getRatio(size.width));
    }
  }, [size.width]);

  return scale;
}
