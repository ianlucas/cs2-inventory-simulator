/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_ITEMS,
  CS2BaseInventoryItem,
  CS2Economy,
  CS2Inventory,
  ensure
} from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { beforeEach, expect, test, vi } from "vitest";
import {
  enforceCraftRulesForInventoryItem,
  enforceEditRulesForInventoryItem
} from "./item-attribute-rules.server";

const { denied, limits, rule } = vi.hoisted(() => {
  const denied = new Set<string>();
  const limits: Record<string, number> = {};
  function rule(name: string) {
    return {
      for: () => ({
        async get() {
          return limits[name] ?? 5;
        },
        async truthy() {
          if (denied.has(name)) {
            throw new Error(`${name} is not truthy`);
          }
        },
        async notContains(what: unknown) {
          if (denied.has(`${name}:${what}`)) {
            throw new Error(`${name} contains ${what}`);
          }
        }
      })
    };
  }
  return { denied, limits, rule };
});

vi.mock("./rule.server", () =>
  Object.fromEntries(
    [
      "craftAllowKeychains",
      "craftAllowKeychainSeed",
      "craftAllowKeychainX",
      "craftAllowKeychainY",
      "craftAllowKeychainZ",
      "craftAllowNametag",
      "craftAllowSeed",
      "craftAllowSouvenir",
      "craftAllowStatTrak",
      "craftAllowStickerRotation",
      "craftAllowStickers",
      "craftAllowStickerSchema",
      "craftAllowStickerWear",
      "craftAllowStickerX",
      "craftAllowStickerY",
      "craftAllowStyle",
      "craftAllowUpgradeLevel",
      "craftAllowWear",
      "craftHideType",
      "editAllowKeychains",
      "editAllowKeychainSeed",
      "editAllowKeychainX",
      "editAllowKeychainY",
      "editAllowKeychainZ",
      "editAllowNametag",
      "editAllowSeed",
      "editAllowSouvenir",
      "editAllowStatTrak",
      "editAllowStickerRotation",
      "editAllowStickers",
      "editAllowStickerSchema",
      "editAllowStickerWear",
      "editAllowStickerX",
      "editAllowStickerY",
      "editAllowStyle",
      "editAllowUpgradeLevel",
      "editAllowWear",
      "editHideType",
      "inventoryItemMaxPatches",
      "inventoryItemMaxStickers"
    ].map((name) => [name, rule(name)])
  )
);

vi.mock("./item-hide-rules.server", () => ({
  craftHideRules: {},
  editHideRules: {},
  enforceItemHideRules: vi.fn()
}));

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const USER_ID = "76561197960287930";

const all = Array.from(CS2Economy.items.values());
const souvenirWeapon = ensure(
  all.find(
    (item) =>
      item.isWeapon() &&
      item.hasSouvenir() &&
      item.getSouvenirSources().some(({ container }) => container === undefined)
  )
);
const craftedSource = ensure(
  souvenirWeapon
    .getSouvenirSources()
    .find(({ container }) => container === undefined)
);
const SOUVENIR_STICKERS = {
  0: { id: craftedSource.teams[0].sticker.id },
  1: { id: craftedSource.teams[1].sticker.id },
  2: { id: craftedSource.mapStickers[0].id }
};
const highlightCharm = ensure(
  all.find((item) => item.isKeychain() && item.hasHighlights())
);
const HIGHLIGHT_KEYCHAINS = {
  0: { id: highlightCharm.id, highlight: highlightCharm.getHighlights()[0].id }
};

function souvenir(
  stickers: CS2BaseInventoryItem["stickers"] = SOUVENIR_STICKERS
) {
  return { id: souvenirWeapon.id, souvenir: true as const, stickers };
}

function inventoryItem() {
  const inventory = new CS2Inventory();
  inventory.add({ id: souvenirWeapon.id });
  return inventory.get(0);
}

beforeEach(() => {
  denied.clear();
  for (const name of Object.keys(limits)) {
    delete limits[name];
  }
});

test("crafting a souvenir requires craftAllowSouvenir", async () => {
  denied.add("craftAllowSouvenir");
  await expect(
    enforceCraftRulesForInventoryItem(souvenir(), USER_ID)
  ).rejects.toThrow();
  await expect(
    enforceCraftRulesForInventoryItem({ id: souvenirWeapon.id }, USER_ID)
  ).resolves.toBeUndefined();
});

test("a crafted souvenir's stickers skip the sticker rules", async () => {
  denied.add("craftAllowStickers");
  denied.add("craftHideType:sticker");
  limits.inventoryItemMaxStickers = 0;
  await expect(
    enforceCraftRulesForInventoryItem(souvenir(), USER_ID)
  ).resolves.toBeUndefined();
  await expect(
    enforceCraftRulesForInventoryItem(
      { id: souvenirWeapon.id, stickers: SOUVENIR_STICKERS },
      USER_ID
    )
  ).rejects.toThrow();
});

test("a crafted souvenir's sticker attributes still follow their rules", async () => {
  denied.add("craftAllowStickerWear");
  await expect(
    enforceCraftRulesForInventoryItem(
      souvenir({
        ...SOUVENIR_STICKERS,
        0: { ...SOUVENIR_STICKERS[0], wear: 0.5 }
      }),
      USER_ID
    )
  ).rejects.toThrow();
});

test("a highlight charm needs no rule beyond keychains", async () => {
  denied.add("craftAllowKeychainSeed");
  await expect(
    enforceCraftRulesForInventoryItem(
      { id: souvenirWeapon.id, keychains: HIGHLIGHT_KEYCHAINS },
      USER_ID
    )
  ).resolves.toBeUndefined();
  await expect(
    enforceCraftRulesForInventoryItem(
      {
        id: highlightCharm.id,
        highlight: highlightCharm.getHighlights()[0].id
      },
      USER_ID
    )
  ).resolves.toBeUndefined();
});

test("editing a souvenir requires editAllowSouvenir", async () => {
  denied.add("editAllowSouvenir");
  await expect(
    enforceEditRulesForInventoryItem(
      { souvenir: true, stickers: SOUVENIR_STICKERS },
      USER_ID,
      inventoryItem()
    )
  ).rejects.toThrow();
  await expect(
    enforceEditRulesForInventoryItem({}, USER_ID, inventoryItem())
  ).resolves.toBeUndefined();
});

test("an edited souvenir's stickers skip the sticker rules", async () => {
  denied.add("editAllowStickers");
  denied.add("editHideType:sticker");
  limits.inventoryItemMaxStickers = 0;
  await expect(
    enforceEditRulesForInventoryItem(
      { souvenir: true, stickers: SOUVENIR_STICKERS },
      USER_ID,
      inventoryItem()
    )
  ).resolves.toBeUndefined();
  await expect(
    enforceEditRulesForInventoryItem(
      { stickers: SOUVENIR_STICKERS },
      USER_ID,
      inventoryItem()
    )
  ).rejects.toThrow();
});
