/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_ITEMS, CS2Economy } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations";
import { describe, expect, it } from "vitest";
import { ViewerCatalogLike } from "~/data/viewer";
import { getItemIconKey, isIconRenderable } from "./item-icon";

CS2Economy.load({ items: CS2_ITEMS, language: english });

const AK47_ID = 4;
const KARAMBIT_ID = 41;
const STICKER_ID = 2226;
const CATALOG: ViewerCatalogLike = { maxId: 100000, holes: [] };

describe("getItemIconKey", () => {
  it("is stable against the order the item's fields were built in", () => {
    expect(getItemIconKey({ id: AK47_ID, seed: 42, wear: 0.1 })).toBe(
      getItemIconKey({ wear: 0.1, id: AK47_ID, seed: 42 })
    );
  });

  it("separates items the viewer would draw differently", () => {
    const base = getItemIconKey({ id: AK47_ID, seed: 42, wear: 0.1 });
    expect(getItemIconKey({ id: AK47_ID, seed: 43, wear: 0.1 })).not.toBe(base);
    expect(getItemIconKey({ id: AK47_ID, seed: 42, wear: 0.2 })).not.toBe(base);
  });

  it("keeps wear unrounded, since a per-user cache has nothing to dedupe", () => {
    expect(getItemIconKey({ id: AK47_ID, wear: 0.1234 })).not.toBe(
      getItemIconKey({ id: AK47_ID, wear: 0.1235 })
    );
  });

  it("separates a StatTrak count and a name tag, both of which the viewer draws", () => {
    const plain = getItemIconKey({ id: AK47_ID });
    expect(getItemIconKey({ id: AK47_ID, statTrak: 0 })).not.toBe(plain);
    expect(getItemIconKey({ id: AK47_ID, statTrak: 1 })).not.toBe(
      getItemIconKey({ id: AK47_ID, statTrak: 0 })
    );
    expect(getItemIconKey({ id: AK47_ID, nameTag: "mine" })).not.toBe(plain);
  });

  it("treats an absent field and an undefined one as the same item", () => {
    expect(getItemIconKey({ id: AK47_ID, seed: undefined })).toBe(
      getItemIconKey({ id: AK47_ID })
    );
  });

  it("orders sticker slots by slot, not by the order they were applied", () => {
    expect(
      getItemIconKey({
        id: AK47_ID,
        stickers: { 3: { id: STICKER_ID }, 1: { id: STICKER_ID } }
      })
    ).toBe(
      getItemIconKey({
        id: AK47_ID,
        stickers: { 1: { id: STICKER_ID }, 3: { id: STICKER_ID } }
      })
    );
  });
});

describe("isIconRenderable", () => {
  it("draws the kinds whose flat art cannot show what the user owns", () => {
    expect(isIconRenderable(CATALOG, { id: AK47_ID })).toBe(true);
    expect(isIconRenderable(CATALOG, { id: KARAMBIT_ID })).toBe(true);
  });

  it("leaves a sticker on its flat art, which already is its picture", () => {
    expect(isIconRenderable(CATALOG, { id: STICKER_ID })).toBe(false);
  });

  it("refuses an id the viewer's catalog does not carry", () => {
    expect(isIconRenderable({ maxId: 1, holes: [] }, { id: AK47_ID })).toBe(
      false
    );
    expect(isIconRenderable(undefined, { id: AK47_ID })).toBe(false);
  });

  it("refuses an id that names nothing", () => {
    expect(isIconRenderable(CATALOG, { id: -1 })).toBe(false);
  });
});
