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

// TODO Review the need of these error flags.
function getSupportsPassive() {
  let supportsPassive = false;
  try {
    // @ts-expect-error Function signature.
    window.addEventListener(
      "test",
      null,
      Object.defineProperty({}, "passive", {
        get: function () {
          supportsPassive = true;
        }
      })
    );
  } catch (ex) {}
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
  // @ts-expect-error Function signature.
  window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
  // @ts-expect-error Function signature.
  window.removeEventListener("touchmove", preventDefault, wheelOpt);
}

export function useLockScroll() {
  useEffect(() => {
    disableScroll();
    return () => enableScroll();
  }, []);
}
