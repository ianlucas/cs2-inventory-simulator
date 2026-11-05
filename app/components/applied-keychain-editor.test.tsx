/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, ensure } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { dragRange, loadEconomy, setupTestRoot } from "~/test-utils";
import {
  AppliedKeychainEditor,
  type AppliedKeychainData
} from "./applied-keychain-editor";

loadEconomy();

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
  const view = setupTestRoot();

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
    view.render(<Parent />);
    const seed = ensure(
      view.container.querySelector<HTMLInputElement>('input[type="range"]')
    );

    expect(dragRange(seed, 80)).toEqual([]);
    expect(parentValue?.seed).toBe(Number(seed.value));
  });
});
