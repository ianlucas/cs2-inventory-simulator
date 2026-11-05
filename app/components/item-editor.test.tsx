/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2Inventory, ensure } from "@ianlucas/cs2-lib";
import { act, useState } from "react";
import { flushSync } from "react-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  dragRange,
  loadEconomy,
  setInputValue,
  setupTestRoot
} from "~/test-utils";
import { ItemEditor, type ItemEditorAttributes } from "./item-editor";

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
  const view = setupTestRoot();
  let onChange: ReturnType<
    typeof vi.fn<(attributes: ItemEditorAttributes | undefined) => void>
  >;

  beforeEach(() => {
    onChange = vi.fn();
    function Parent() {
      const [, setAttributes] = useState<ItemEditorAttributes>();
      return (
        <ItemEditor
          isHideKeychains
          isHidePatches
          isHideStatTrak
          isHideStickers
          item={item}
          onChange={(attributes) => {
            onChange(attributes);
            setAttributes(attributes);
          }}
        />
      );
    }
    view.render(<Parent />);
  });

  function getInput(label: string, selector = "input") {
    const field = Array.from(view.container.querySelectorAll("label")).find(
      (element) => element.textContent === label
    )?.parentElement;
    return ensure(field?.querySelector<HTMLInputElement>(selector));
  }

  function type(input: HTMLInputElement, value: string) {
    act(() => setInputValue(input, value));
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

  test("keeps the parent in step through a fast wear drag", () => {
    const wear = getInput("EditorWear", 'input[type="range"]');
    expect(dragRange(wear, 80)).toEqual([]);
    expect(lastAttributes()?.wear).toBe(Number(wear.value));
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
  const view = setupTestRoot();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function getFirstCommitLayout(target: typeof item, height: number) {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(
      height
    );
    let classList: string[] = [];
    act(() => {
      flushSync(() =>
        view.root.render(
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
      classList = [...(view.container.firstElementChild?.classList ?? [])];
    });
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
      view.render(
        <ItemEditor
          isHideKeychains
          isHidePatches
          isHideStatTrak
          isHideStickers
          item={knife}
        />
      );
      expect(view.container.firstElementChild?.classList).toContain("w-160");
      offsetHeight.mockReturnValue(height);
      const reset = ensure(
        view.container
          .querySelector('svg[data-icon="arrow-rotate-left"]')
          ?.closest("button")
      );
      await act(async () => reset.click());
      expect(view.container.firstElementChild?.classList).toContain(
        layoutClass
      );
    }
  );
});
