/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2_ITEMS, ensure } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { dragRange } from "~/test-utils";
import {
  AppliedKeychainEditor,
  type AppliedKeychainData
} from "./applied-keychain-editor";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

vi.mock("./app-context", () => ({
  useTranslate: () => (key: string) => key
}));

vi.mock("./editor-item-display", () => ({
  EditorItemDisplay: () => null
}));

vi.mock("./modal-generic", () => ({
  confirm: async () => true
}));

const keychain = ensure(
  CS2Economy.itemsAsArray.find((item) => item.isKeychain() && item.hasSeed())
);

describe("AppliedKeychainEditor", () => {
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

  test("keeps the parent in step through a fast slider drag", () => {
    let parentValue: AppliedKeychainData | undefined;
    function Parent() {
      const [value, setValue] = useState<AppliedKeychainData>({
        seed: 1,
        x: 0,
        y: 0,
        z: 0
      });
      parentValue = value;
      return (
        <AppliedKeychainEditor
          isHideKeychainX
          isHideKeychainY
          isHideKeychainZ
          item={keychain}
          onChange={setValue}
          value={value}
        />
      );
    }
    act(() => root.render(<Parent />));
    const seed = ensure(
      container.querySelector<HTMLInputElement>('input[type="range"]')
    );

    expect(dragRange(seed, 80)).toEqual([]);
    expect(parentValue?.seed).toBe(Number(seed.value));
  });
});
