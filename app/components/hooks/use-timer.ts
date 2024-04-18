/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useRef } from "react";

export function useTimer() {
  const ref = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      ref.current.forEach((idx) => clearTimeout(idx));
      ref.current = [];
    };
  }, []);

  return function timer(callback: () => void, ms: number) {
    ref.current.push(setTimeout(callback, ms));
  };
}
