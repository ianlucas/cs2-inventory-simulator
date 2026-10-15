/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2Inventory, CS2_ITEMS, ensure } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { act } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ItemEditor, type ItemEditorAttributes } from "./item-editor";

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

vi.mock("./hooks/use-is-desktop", () => ({
  useIsDesktop: () => true
}));

vi.mock("./hooks/use-viewer-availability", () => ({
  useViewerAvailability: () => ({
    canUse3d: false,
    isIdSupported: () => false
  })
}));

const item = ensure(
  CS2Economy.itemsAsArray.find(
    (item) =>
      item.isWeapon() &&
      item.isPaintable() &&
      item.hasNameTag() &&
      item.hasSeed() &&
      item.hasWear()
  )
);

describe("ItemEditor", () => {
  let container: HTMLElement;
  let root: Root;
  let onChange: ReturnType<
    typeof vi.fn<(attributes: ItemEditorAttributes | undefined) => void>
  >;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    onChange = vi.fn();
    act(() => {
      root.render(
        <ItemEditor
          isHideKeychains
          isHidePatches
          isHideStatTrak
          isHideStickers
          item={item}
          onChange={onChange}
        />
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function getInput(label: string) {
    const field = Array.from(container.querySelectorAll("label")).find(
      (element) => element.textContent === label
    )?.parentElement;
    return ensure(field?.querySelector<HTMLInputElement>("input"));
  }

  function type(input: HTMLInputElement, value: string) {
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  function blur(input: HTMLInputElement) {
    act(() => {
      input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });
  }

  function lastAttributes() {
    return onChange.mock.lastCall?.[0];
  }

  test.each([
    ["Bamboo ", "Bamboo"],
    [" Bamboo", "Bamboo"],
    ["   ", undefined]
  ])("trims the name tag %j to %j", (input, expected) => {
    type(getInput("EditorNametag"), input);
    expect(lastAttributes()?.nameTag).toBe(expected);
    expect(() =>
      new CS2Inventory().add({
        id: item.id,
        nameTag: lastAttributes()?.nameTag
      })
    ).not.toThrow();
  });

  test("emits undefined while the name tag is invalid", () => {
    const nameTag = getInput("EditorNametag");
    type(nameTag, "Bam\tboo");
    expect(lastAttributes()).toBeUndefined();
    type(nameTag, "Bamboo");
    expect(lastAttributes()?.nameTag).toBe("Bamboo");
  });

  test("emits undefined while a number input is invalid", () => {
    const seed = getInput("EditorPattern");
    type(seed, "42");
    expect(lastAttributes()?.seed).toBe(42);
    type(seed, String(item.getMaximumSeed() + 1));
    expect(lastAttributes()).toBeUndefined();
    blur(seed);
    expect(lastAttributes()?.seed).toBe(42);
  });
});

describe("ItemEditor layout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each([
    [250, "w-105"],
    [251, "w-160"]
  ])("opens with fields %ipx tall in the %s layout", (height, layoutClass) => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(
      height
    );
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      flushSync(() =>
        root.render(
          <ItemEditor
            isHideKeychains
            isHidePatches
            isHideStatTrak
            isHideStickers
            item={item}
          />
        )
      );
      // Checked before act flushes the rest, i.e. on the first commit.
      expect(container.firstElementChild?.classList).toContain(layoutClass);
    });
    act(() => root.unmount());
    container.remove();
  });
});
