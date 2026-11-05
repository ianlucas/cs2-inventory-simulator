/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { act } from "react";
import { describe, expect, test, vi } from "vitest";
import { setupTestRoot } from "~/test-utils";
import { useOverlayTransition } from "./hooks/use-overlay-transition";
import { Presence } from "./presence";

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
  const view = setupTestRoot();

  const renderPresence = (present: boolean) =>
    view.render(
      <Presence present={present}>{present ? <TestOverlay /> : null}</Presence>
    );

  const overlay = () =>
    view.container.querySelector<HTMLElement>('[data-testid="overlay"]');

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

  test("makes the overlay inert only while it is closing", () => {
    renderPresence(true);
    expect(overlay()?.hasAttribute("inert")).toBe(false);
    renderPresence(false);
    expect(overlay()?.hasAttribute("inert")).toBe(true);
    renderPresence(true);
    expect(overlay()?.hasAttribute("inert")).toBe(false);
  });

  test("reopening before the exit finishes cancels the unmount", () => {
    renderPresence(true);
    renderPresence(false);
    renderPresence(true);
    expect(overlay()?.getAttribute("data-state")).toBe("open");
    endAnimation();
    expect(overlay()).not.toBeNull();
  });

  test("notifies when the exit animation completes", () => {
    const onExitComplete = vi.fn();
    view.render(
      <Presence present={true} onExitComplete={onExitComplete}>
        <TestOverlay />
      </Presence>
    );
    view.render(
      <Presence present={false} onExitComplete={onExitComplete}>
        {null}
      </Presence>
    );
    endAnimation();
    expect(onExitComplete).toHaveBeenCalledOnce();
  });
});
