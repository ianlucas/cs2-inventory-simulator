/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { act } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { loadEconomy, setupTestRoot } from "~/test-utils";
import { HighlightReelPopup } from "./highlight-reel-popup";

loadEconomy();

vi.mock("./app-context", () => ({
  useTranslate: () => (key: string) => key
}));

const highlight = CS2Economy.getById(28171);

describe("HighlightReelPopup", () => {
  const view = setupTestRoot();

  afterEach(() => {
    window.localStorage.clear();
  });

  function render(onClose = vi.fn()) {
    view.render(<HighlightReelPopup highlight={highlight} onClose={onClose} />);
    return onClose;
  }

  test("titles the clip with the tournament and the highlight, like the game", () => {
    render();
    expect(document.body.textContent).toContain(
      "Austin 2025 | chopper Double Kill"
    );
  });

  test("loops the 1080p clip with sound at the app volume", () => {
    window.localStorage.setItem("appVolume", "0.25");
    render();
    const video = document.body.querySelector("video");
    expect(video?.src).toBe(highlight.getVideoUrl("1080p"));
    expect(video?.loop).toBe(true);
    expect(video?.muted).toBe(false);
    expect(video?.volume).toBe(0.25);
  });

  test("closes on Escape without closing the inspect underneath", () => {
    const inspectEscape = vi.fn();
    window.addEventListener("keyup", inspectEscape);
    const onClose = render();
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent("keyup", { bubbles: true, key: "Escape" })
      );
    });
    window.removeEventListener("keyup", inspectEscape);
    expect(onClose).toHaveBeenCalledOnce();
    expect(inspectEscape).not.toHaveBeenCalled();
  });
});
