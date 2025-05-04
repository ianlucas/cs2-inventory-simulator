/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RefObject, useEffect } from "react";

export function useDetectCollision({
  disabled,
  target,
  hits,
  then
}: {
  disabled?: boolean;
  target: RefObject<Element | null>;
  hits: RefObject<Element | null>;
  then: () => void;
}) {
  useEffect(() => {
    if (target.current && hits.current && !disabled) {
      let lastCollisionId = "";
      let idx: ReturnType<typeof setTimeout> = null!;
      function check() {
        if (target.current && hits.current && !disabled) {
          const targetRect = target.current.getBoundingClientRect();
          const children = Array.from(hits.current.children);
          for (const child of children) {
            const childRect = child.getBoundingClientRect();
            if (
              childRect.left < targetRect.right &&
              childRect.right > targetRect.left &&
              childRect.top < targetRect.bottom &&
              childRect.bottom > targetRect.top
            ) {
              if (lastCollisionId !== child.getAttribute("data-id")) {
                lastCollisionId = child.getAttribute("data-id")!;
                then();
              }
            }
          }
          idx = setTimeout(check, 1000 / 60);
        }
      }
      check();
      return () => clearTimeout(idx);
    }
  }, [disabled, target.current, hits.current]);
}
