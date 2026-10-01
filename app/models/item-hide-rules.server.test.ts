/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_ITEMS, CS2Economy, CS2ItemType } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { beforeEach, expect, test, vi } from "vitest";
import {
  craftHideRules,
  enforceCraftItemHideRules,
  enforceItemHideRules
} from "./item-hide-rules.server";

const { hidden, rule } = vi.hoisted(() => {
  const hidden: Record<string, unknown[]> = {};
  function rule(name: string) {
    return {
      for: () => ({
        async notContains(what: unknown) {
          if (hidden[name]?.includes(what)) {
            throw new Error(`${name} contains ${what}`);
          }
        }
      })
    };
  }
  return { hidden, rule };
});

vi.mock("./rule.server", () => ({
  craftHideCategory: rule("craftHideCategory"),
  craftHideFilterType: rule("craftHideFilterType"),
  craftHideId: rule("craftHideId"),
  craftHideModel: rule("craftHideModel"),
  craftHideType: rule("craftHideType"),
  editHideCategory: rule("editHideCategory"),
  editHideId: rule("editHideId"),
  editHideModel: rule("editHideModel"),
  editHideType: rule("editHideType")
}));

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const USER_ID = "76561197960287930";
const AK47_ID = 4;
const FALLEN_COLOGNE_2015_ID = 2226;

beforeEach(() => {
  for (const name of Object.keys(hidden)) {
    delete hidden[name];
  }
});

test("enforceCraftItemHideRules allows an item no rule hides", async () => {
  await expect(
    enforceCraftItemHideRules(FALLEN_COLOGNE_2015_ID, USER_ID)
  ).resolves.toBeUndefined();
});

test("enforceCraftItemHideRules rejects a type in craftHideFilterType", async () => {
  hidden.craftHideFilterType = [CS2ItemType.Sticker];
  await expect(
    enforceCraftItemHideRules(FALLEN_COLOGNE_2015_ID, USER_ID)
  ).rejects.toThrow();
});

test("enforceCraftItemHideRules allows other types when craftHideFilterType is set", async () => {
  hidden.craftHideFilterType = [CS2ItemType.Sticker];
  await expect(
    enforceCraftItemHideRules(AK47_ID, USER_ID)
  ).resolves.toBeUndefined();
});

test("enforceCraftItemHideRules rejects a type in craftHideType", async () => {
  hidden.craftHideType = [CS2ItemType.Sticker];
  await expect(
    enforceCraftItemHideRules(FALLEN_COLOGNE_2015_ID, USER_ID)
  ).rejects.toThrow();
});

test("enforceItemHideRules allows an attachment whose type is in craftHideFilterType", async () => {
  hidden.craftHideFilterType = [CS2ItemType.Sticker];
  await expect(
    enforceItemHideRules(FALLEN_COLOGNE_2015_ID, USER_ID, craftHideRules)
  ).resolves.toBeUndefined();
});

test("enforceItemHideRules rejects an attachment whose type is in craftHideType", async () => {
  hidden.craftHideType = [CS2ItemType.Sticker];
  await expect(
    enforceItemHideRules(FALLEN_COLOGNE_2015_ID, USER_ID, craftHideRules)
  ).rejects.toThrow();
});
