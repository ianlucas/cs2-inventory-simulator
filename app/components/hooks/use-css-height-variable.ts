/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useRef } from "react";

export function useCssHeightVariable<T extends HTMLElement>(name: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null) {
      return;
    }
    const style = document.documentElement.style;
    const observer = new ResizeObserver(() =>
      style.setProperty(name, `${element.offsetHeight}px`)
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      style.removeProperty(name);
    };
  }, [name]);

  return ref;
}
