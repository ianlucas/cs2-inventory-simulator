/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect } from "react";

/**
 * @see https://stackoverflow.com/questions/4770025/how-to-disable-scrolling-temporarily
 */
const scrollKeys: Record<string, boolean> = {
  "Space": true,
  "PageUp": true,
  "PageDown": true,
  "End": true,
  "Home": true
};

function preventDefault(event: Event) {
  event.preventDefault();
}

function preventDefaultForScrollKeys(event: globalThis.KeyboardEvent) {
  if (scrollKeys[event.code]) {
    preventDefault(event);
    return false;
  }
}

function getSupportsPassive() {
  let supportsPassive = false;
  try {
    // @ts-ignore
    window.addEventListener(
      "test",
      null,
      Object.defineProperty({}, "passive", {
        get: function() {
          supportsPassive = true;
        }
      })
    );
  } catch (e) {}
  return supportsPassive;
}

function getWheelArgs() {
  return {
    wheelOpt: getSupportsPassive() ? { passive: false } : false,
    wheelEvent: "onwheel" in document.createElement("div")
      ? "wheel" as const
      : "mousewheel" as const
  };
}

function disableScroll() {
  const { wheelEvent, wheelOpt } = getWheelArgs();
  window.addEventListener("DOMMouseScroll", preventDefault, false);
  window.addEventListener(wheelEvent, preventDefault, wheelOpt);
  window.addEventListener("touchmove", preventDefault, wheelOpt);
  window.addEventListener("keydown", preventDefaultForScrollKeys, false);
}

function enableScroll() {
  const { wheelEvent, wheelOpt } = getWheelArgs();
  window.removeEventListener("DOMMouseScroll", preventDefault, false);
  // @ts-ignore
  window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
  // @ts-ignore
  window.removeEventListener("touchmove", preventDefault, wheelOpt);
  window.removeEventListener("keydown", preventDefaultForScrollKeys, false);
}

export function useLockScroll() {
  useEffect(() => {
    disableScroll();
    return () => enableScroll();
  }, []);
}
