/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { act } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { confirm } from "./modal-generic";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const context = vi.hoisted(() => ({
  sync: new EventTarget()
}));

vi.mock("~/sync", () => ({
  sync: context.sync
}));

function openConfirm() {
  let result!: Promise<boolean>;
  act(() => {
    result = confirm({
      bodyText: "Body",
      cancelText: "Cancel",
      confirmText: "Confirm",
      titleText: "Title"
    });
  });
  return result;
}

function findButton(text: string) {
  return Array.from(document.body.querySelectorAll("button")).find(
    (button) => button.textContent === text
  );
}

describe("confirm", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("resolves true when confirmed", async () => {
    const result = openConfirm();
    act(() => findButton("Confirm")?.click());
    await expect(result).resolves.toBe(true);
    expect(document.body.textContent).not.toContain("Title");
  });

  test("dismisses as cancelled on sync error", async () => {
    const result = openConfirm();
    expect(document.body.textContent).toContain("Title");

    act(() => {
      context.sync.dispatchEvent(new Event("syncerror"));
    });
    await expect(result).resolves.toBe(false);
    expect(document.body.textContent).not.toContain("Title");
  });
});
