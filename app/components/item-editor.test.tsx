/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2EconomyItem,
  CS2Inventory,
  CS2InventoryItem,
  CS2SouvenirSource,
  ensure
} from "@ianlucas/cs2-lib";
import { act, useState } from "react";
import { flushSync } from "react-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createFakeInventoryItemFromBase } from "~/shared/inventory";
import {
  createSouvenirSelection,
  getSouvenirAutographs,
  getSouvenirKeychains,
  getSouvenirStickers,
  type SouvenirSelection
} from "~/shared/souvenir";
import {
  dragRange,
  findButton,
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

vi.mock("./sticker-picker", () => ({
  StickerPicker: () => null
}));

vi.mock("./keychain-picker", () => ({
  KeychainPicker: () => null
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

function completeSouvenirSelection(
  source: CS2SouvenirSource,
  value: SouvenirSelection
): SouvenirSelection {
  const [teamA, teamB] = source.teams;
  const selection: SouvenirSelection = {
    ...value,
    highlightId: source.highlights[0]?.id,
    mapStickerId: value.mapStickerId ?? source.mapStickers[0]?.id,
    teamIds: [teamA?.id, teamB?.id]
  };
  return {
    ...selection,
    autographId: getSouvenirAutographs(source, selection)[0]?.id
  };
}

vi.mock("./souvenir-panel", async () => {
  const { createElement } = await import("react");
  return {
    getSouvenirSourceLabel: () => "SouvenirSource",
    SouvenirPanel: ({
      onChange,
      sources,
      value
    }: {
      onChange: (selection: SouvenirSelection) => void;
      sources: CS2SouvenirSource[];
      value: SouvenirSelection;
    }) =>
      createElement("button", {
        children: "CompleteSouvenir",
        onClick: () =>
          onChange(
            completeSouvenirSelection(ensure(sources[value.sourceIndex]), value)
          ),
        type: "button"
      })
  };
});

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

const souvenirWeapon = ensure(
  CS2Economy.itemsAsArray.find(
    (item) =>
      item.isWeapon() &&
      item.hasStatTrak() &&
      item.hasSouvenir() &&
      item.getSouvenirSources().some(({ teams }) => teams.length >= 2)
  )
);

const statTrakKnife = ensure(
  CS2Economy.itemsAsArray.find(
    (item) => item.isMelee() && item.hasStatTrak() && !item.hasSouvenir()
  )
);

const gloves = ensure(CS2Economy.itemsAsArray.find((item) => item.isGloves()));

describe("ItemEditor type", () => {
  const view = setupTestRoot();
  let onChange: ReturnType<
    typeof vi.fn<(attributes: ItemEditorAttributes | undefined) => void>
  >;

  beforeEach(() => {
    onChange = vi.fn();
  });

  function render(
    target: CS2EconomyItem | CS2InventoryItem,
    props: {
      isDisabled?: boolean;
      isHideKeychains?: boolean;
      isHideSouvenir?: boolean;
      isHideStatTrak?: boolean;
      isHideStickers?: boolean;
    } = {}
  ) {
    view.render(
      <ItemEditor
        isHideKeychains
        isHidePatches
        isHideStickers
        item={target}
        onChange={onChange}
        {...props}
      />
    );
  }

  function hasField(label: string) {
    return Array.from(view.container.querySelectorAll("label")).some(
      (element) => element.textContent === label
    );
  }

  function getTypeRow() {
    return Array.from(view.container.querySelectorAll("label")).find(
      (label) => label.textContent === "EditorType"
    )?.parentElement;
  }

  function getTypeButtons() {
    return Array.from(
      ensure(getTypeRow()).querySelectorAll<HTMLButtonElement>(
        "button[aria-pressed]"
      )
    );
  }

  function getTypeLabels() {
    return getTypeButtons().map(
      (button) => button.querySelector("span > span")?.textContent
    );
  }

  function getSelectedType() {
    return getTypeLabels()[
      getTypeButtons().findIndex(
        (button) => button.getAttribute("aria-pressed") === "true"
      )
    ];
  }

  function pickType(label: string) {
    const button = ensure(
      getTypeButtons()[getTypeLabels().findIndex((other) => other === label)]
    );
    act(() => button.click());
  }

  function click(text: string) {
    act(() => ensure(findButton(text)).click());
  }

  function lastAttributes() {
    return onChange.mock.lastCall?.[0];
  }

  test.each([
    [
      "a weapon",
      souvenirWeapon,
      {},
      ["EditorTypeNormal", "EditorStatTrak", "EditorSouvenir"]
    ],
    ["a knife", statTrakKnife, {}, ["EditorTypeNormal", "EditorStatTrak"]],
    [
      "a weapon without StatTrak allowed",
      souvenirWeapon,
      { isHideStatTrak: true },
      ["EditorTypeNormal", "EditorSouvenir"]
    ],
    [
      "a weapon without Souvenir allowed",
      souvenirWeapon,
      { isHideSouvenir: true },
      ["EditorTypeNormal", "EditorStatTrak"]
    ]
  ])("offers %s only the types it can have", (_, target, props, labels) => {
    render(target, props);
    expect(getTypeLabels()).toEqual(labels);
    expect(getSelectedType()).toBe("EditorTypeNormal");
  });

  test("hides the type for items that can only be normal", () => {
    render(gloves);
    expect(getTypeRow()).toBeUndefined();
  });

  test("switches between StatTrak and Normal", () => {
    render(souvenirWeapon);
    pickType("EditorStatTrak");
    expect(lastAttributes()?.statTrak).toBe(true);
    expect(getSelectedType()).toBe("EditorStatTrak");
    pickType("EditorTypeNormal");
    expect(lastAttributes()?.statTrak).toBeUndefined();
    expect(getSelectedType()).toBe("EditorTypeNormal");
  });

  test("shows the souvenir fields inline until they are complete", () => {
    render(souvenirWeapon);
    pickType("EditorStatTrak");
    pickType("EditorSouvenir");
    expect(findButton("CompleteSouvenir")).toBeDefined();
    expect(findButton("EditorCancel")).toBeUndefined();
    expect(lastAttributes()).toBeUndefined();
    click("CompleteSouvenir");
    expect(lastAttributes()?.souvenir).toBe(true);
    expect(lastAttributes()?.statTrak).toBeUndefined();
    expect(lastAttributes()?.stickers).toBeDefined();
    expect(getSelectedType()).toBe("EditorSouvenir");
  });

  test("drops the souvenir stickers when leaving Souvenir", () => {
    render(souvenirWeapon);
    pickType("EditorSouvenir");
    click("CompleteSouvenir");
    pickType("EditorTypeNormal");
    expect(lastAttributes()).toMatchObject({
      souvenir: undefined,
      statTrak: undefined,
      stickers: undefined
    });
    expect(findButton("CompleteSouvenir")).toBeUndefined();
  });

  test("starts the souvenir over when going back to Souvenir", () => {
    render(souvenirWeapon);
    pickType("EditorSouvenir");
    click("CompleteSouvenir");
    pickType("EditorTypeNormal");
    pickType("EditorSouvenir");
    expect(lastAttributes()).toBeUndefined();
  });

  test("swaps the sticker and charm pickers for the souvenir fields", () => {
    render(souvenirWeapon, { isHideKeychains: false, isHideStickers: false });
    expect(hasField("EditorStickers")).toBe(true);
    expect(hasField("EditorKeychains")).toBe(true);
    pickType("EditorSouvenir");
    expect(hasField("EditorStickers")).toBe(false);
    expect(hasField("EditorKeychains")).toBe(false);
    expect(hasField("EditorNametag")).toBe(true);
    expect(findButton("CompleteSouvenir")).toBeDefined();
  });

  test("opens an existing StatTrak item as StatTrak", () => {
    render(
      createFakeInventoryItemFromBase({ id: souvenirWeapon.id, statTrak: 0 })
    );
    expect(getSelectedType()).toBe("EditorStatTrak");
    expect(lastAttributes()?.statTrak).toBe(true);
  });

  test("opens an existing souvenir with its fields filled in", () => {
    const sources = souvenirWeapon.getSouvenirSources();
    const sourceIndex = sources.findIndex(({ teams }) => teams.length >= 2);
    const source = ensure(sources[sourceIndex]);
    const selection = completeSouvenirSelection(
      source,
      createSouvenirSelection(sources, sourceIndex)
    );
    render(
      createFakeInventoryItemFromBase({
        id: souvenirWeapon.id,
        keychains: getSouvenirKeychains(souvenirWeapon, {}, selection),
        souvenir: true,
        stickers: getSouvenirStickers(source, selection)
      })
    );
    expect(getSelectedType()).toBe("EditorSouvenir");
    expect(findButton("CompleteSouvenir")).toBeDefined();
    expect(lastAttributes()?.souvenir).toBe(true);
  });

  test("keeps an incomplete souvenir's stickers until it is edited", () => {
    const source = ensure(
      souvenirWeapon
        .getSouvenirSources()
        .find(({ eventStickers }) => eventStickers.length > 0)
    );
    const stickers = { 0: { id: ensure(source.eventStickers[0]).id } };
    render(
      createFakeInventoryItemFromBase({
        id: souvenirWeapon.id,
        souvenir: true,
        stickers
      })
    );
    expect(getSelectedType()).toBe("EditorSouvenir");
    expect(findButton("CompleteSouvenir")).toBeUndefined();
    expect(lastAttributes()).toMatchObject({ souvenir: true, stickers });
    const edit = ensure(
      view.container.querySelector('svg[data-icon="pen"]')?.closest("button")
    );
    act(() => edit.click());
    expect(findButton("CompleteSouvenir")).toBeDefined();
    expect(lastAttributes()).toBeUndefined();
  });

  test("shows the type as text when read-only", () => {
    render(
      createFakeInventoryItemFromBase({ id: statTrakKnife.id, statTrak: 0 }),
      { isDisabled: true }
    );
    expect(getTypeButtons()).toEqual([]);
    expect(getTypeRow()?.textContent).toContain("EditorStatTrak");
  });

  test("shows a read-only souvenir without its fields", () => {
    render(
      createFakeInventoryItemFromBase({
        id: souvenirWeapon.id,
        souvenir: true
      }),
      { isDisabled: true }
    );
    expect(getTypeRow()?.textContent).toContain("EditorSouvenir");
    expect(findButton("CompleteSouvenir")).toBeUndefined();
  });
});
