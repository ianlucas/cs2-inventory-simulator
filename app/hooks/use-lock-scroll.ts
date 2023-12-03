/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect } from "react";

/**
 * @see https://stackoverflow.com/questions/4770025/how-to-disable-scrolling-temporarily
 */
function preventDefault(event: Event) {
  event.preventDefault();
}

function getSupportsPassive() {
  let supportsPassive = false;
  try {
    // @ts-ignore
    window.addEventListener(
      "test",
      null,
      Object.defineProperty({}, "passive", {
        get: function () {
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
    wheelEvent:
      "onwheel" in document.createElement("div")
        ? ("wheel" as const)
        : ("mousewheel" as const)
  };
}

function disableScroll() {
  const { wheelEvent, wheelOpt } = getWheelArgs();
  window.addEventListener("DOMMouseScroll", preventDefault, false);
  window.addEventListener(wheelEvent, preventDefault, wheelOpt);
  window.addEventListener("touchmove", preventDefault, wheelOpt);
}

function enableScroll() {
  const { wheelEvent, wheelOpt } = getWheelArgs();
  window.removeEventListener("DOMMouseScroll", preventDefault, false);
  // @ts-ignore
  window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
  // @ts-ignore
  window.removeEventListener("touchmove", preventDefault, wheelOpt);
}

export function useLockScroll() {
  useEffect(() => {
    disableScroll();
    return () => enableScroll();
  }, []);
}
