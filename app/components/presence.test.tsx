/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { useOverlayTransition } from "./hooks/use-overlay-transition";
import { Presence } from "./presence";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function TestOverlay() {
  const transition = useOverlayTransition();
  return (
    <div
      data-testid="overlay"
      className={transition.className}
      {...transition.rootProps}
    />
  );
}

describe("Presence + useOverlayTransition", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderPresence = (present: boolean) =>
    act(() => {
      root.render(
        <Presence present={present}>
          {present ? <TestOverlay /> : null}
        </Presence>
      );
    });

  const overlay = () =>
    container.querySelector<HTMLElement>('[data-testid="overlay"]');

  const endAnimation = () =>
    act(() => {
      overlay()?.dispatchEvent(new Event("animationend", { bubbles: true }));
    });

  test("renders children in the open state while present", () => {
    renderPresence(true);
    expect(overlay()).not.toBeNull();
    expect(overlay()?.getAttribute("data-state")).toBe("open");
  });

  test("keeps children mounted (closed) during the exit, then unmounts on animationend", () => {
    renderPresence(true);
    renderPresence(false);
    expect(overlay()).not.toBeNull();
    expect(overlay()?.getAttribute("data-state")).toBe("closed");
    endAnimation();
    expect(overlay()).toBeNull();
  });

  test("reopening before the exit finishes cancels the unmount", () => {
    renderPresence(true);
    renderPresence(false);
    renderPresence(true);
    expect(overlay()?.getAttribute("data-state")).toBe("open");
    endAnimation();
    expect(overlay()).not.toBeNull();
  });
});
