/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_ITEMS, CS2Economy } from "@ianlucas/cs2-lib";
import { brazilian } from "@ianlucas/cs2-lib/translations/brazilian";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { expect, it } from "vitest";
import { getItemTranslation } from "./item-translation.server";

CS2Economy.load({ items: CS2_ITEMS, language: english });

const AK47_ID = 4;

it("translates the item into the requested language", async () => {
  const item = CS2Economy.getById(AK47_ID);
  expect(await getItemTranslation(item, "brazilian")).toEqual(
    brazilian[AK47_ID]
  );
});

it("falls back to English", async () => {
  const item = CS2Economy.getById(AK47_ID);
  expect(await getItemTranslation(item, undefined)).toBe(item.language);
  expect(await getItemTranslation(item, "klingon")).toBe(item.language);
});
