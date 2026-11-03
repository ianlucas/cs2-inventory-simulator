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

vi.mock("./modal-generic", () => ({
  confirm: async () => true
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

const knife = ensure(
  CS2Economy.itemsAsArray.find(
    (item) =>
      item.isMelee() &&
      item.isPaintable() &&
      item.hasNameTag() &&
      item.hasSeed() &&
      item.hasWear()
  )
);

describe("ItemEditor layout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function getFirstCommitLayout(target: typeof item, height: number) {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(
      height
    );
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    let classList: string[] = [];
    act(() => {
      flushSync(() =>
        root.render(
          <ItemEditor
            isHideKeychains
            isHidePatches
            isHideStatTrak
            isHideStickers
            item={target}
          />
        )
      );
      // Checked before act flushes the rest, i.e. on the first commit.
      classList = [...(container.firstElementChild?.classList ?? [])];
    });
    act(() => root.unmount());
    container.remove();
    return classList;
  }

  test.each([
    [250, "w-105"],
    [251, "w-160"]
  ])(
    "opens a knife with fields %ipx tall in the %s layout",
    (height, layoutClass) => {
      expect(getFirstCommitLayout(knife, height)).toContain(layoutClass);
    }
  );

  test("opens a weapon in the w-160 layout however short its fields are", () => {
    expect(getFirstCommitLayout(item, 100)).toContain("w-160");
  });

  test.each([
    [250, "w-105"],
    [251, "w-160"]
  ])(
    "re-lays out a tall knife whose fields are %ipx tall after reset in the %s layout",
    async (height, layoutClass) => {
      const offsetHeight = vi
        .spyOn(HTMLElement.prototype, "offsetHeight", "get")
        .mockReturnValue(251);
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(
          <ItemEditor
            isHideKeychains
            isHidePatches
            isHideStatTrak
            isHideStickers
            item={knife}
          />
        );
      });
      expect(container.firstElementChild?.classList).toContain("w-160");
      offsetHeight.mockReturnValue(height);
      const reset = ensure(
        container
          .querySelector('svg[data-icon="arrow-rotate-left"]')
          ?.closest("button")
      );
      await act(async () => reset.click());
      expect(container.firstElementChild?.classList).toContain(layoutClass);
      act(() => root.unmount());
      container.remove();
    }
  );
});
