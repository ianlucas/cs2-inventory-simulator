/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";

export function useCounter(from: number, to: number) {
  const [counter, setCounter] = useState(from);

  useEffect(() => {
    const difference = Math.abs(from - to);
    const duration = difference > 1000 ? 5000 : (difference / 1000) * 5000;

    let animationFrameId: ReturnType<typeof requestAnimationFrame>;
    const startTimestamp = Date.now();

    const updateCounter = () => {
      const timeElapsed = Date.now() - startTimestamp;
      const progress = Math.min(timeElapsed / duration, 1);
      const interpolatedValue = from + (to - from) * progress;

      setCounter(Math.ceil(interpolatedValue));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      }
    };

    updateCounter();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [from, to]);

  return counter;
}
