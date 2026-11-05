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
  AppliedStickerEditor,
  type AppliedStickerData
} from "./applied-sticker-editor";

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

vi.mock("./modal-generic", () => ({
  confirm: async () => true
}));

const sticker = ensure(
  CS2Economy.itemsAsArray.find((item) => item.isSticker())
);
const weapon = ensure(
  CS2Economy.itemsAsArray.find(
    (item) => item.isWeapon() && item.isPaintable() && item.hasStickers()
  )
);
const initial: AppliedStickerData = {
  rotation: 0,
  schema: -1,
  wear: 0,
  x: 0,
  y: 0
};

describe("AppliedStickerEditor", () => {
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

  function getWearRange() {
    return ensure(
      container.querySelector<HTMLInputElement>('input[type="range"]')
    );
  }

  test("keeps the parent in step through a fast slider drag", () => {
    let parentValue: AppliedStickerData | undefined;
    function Parent() {
      const [value, setValue] = useState(initial);
      parentValue = value;
      return (
        <AppliedStickerEditor
          forItem={weapon}
          isHideItemDisplay
          isHidePreview
          item={sticker}
          onChange={setValue}
          value={value}
        />
      );
    }
    act(() => root.render(<Parent />));
    const wear = getWearRange();

    expect(dragRange(wear, 80)).toEqual([]);
    expect(parentValue?.wear).toBe(Number(wear.value));
  });

  test("resyncs to a new revision without echoing it to the parent", () => {
    const onChange = vi.fn<(data: AppliedStickerData) => void>();
    function render(value: AppliedStickerData, valueRevision: number) {
      act(() =>
        root.render(
          <AppliedStickerEditor
            forItem={weapon}
            isHideItemDisplay
            isHidePreview
            item={sticker}
            onChange={onChange}
            value={value}
            valueRevision={valueRevision}
          />
        )
      );
    }
    const resynced = { ...initial, rotation: 90, schema: 1, wear: 0.5 };
    render(initial, 0);
    render(resynced, 1);

    expect(onChange).not.toHaveBeenCalled();
    const wear = getWearRange();
    expect(wear.value).toBe("0.5");

    expect(dragRange(wear, 1)).toEqual([]);
    expect(onChange).toHaveBeenLastCalledWith({
      ...resynced,
      wear: Number(wear.value)
    });
  });
});
