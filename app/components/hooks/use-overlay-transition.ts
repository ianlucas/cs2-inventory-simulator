/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { AnimationEventHandler } from "react";
import { usePresenceContext } from "../presence";

type OverlayTransition = {
  className: string | undefined;
  rootProps: {
    "data-state"?: "open" | "closed";
    onAnimationEnd?: AnimationEventHandler<HTMLElement>;
  };
};

export function useOverlayTransition(): OverlayTransition {
  const presence = usePresenceContext();
  if (presence === null) {
    return { className: undefined, rootProps: {} };
  }
  return {
    className:
      "data-[state=open]:animate-overlay-open data-[state=closed]:animate-overlay-close",
    rootProps: {
      "data-state": presence.state,
      onAnimationEnd: (event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        if (presence.state === "closed") {
          presence.onExitComplete();
        }
      }
    }
  };
}
