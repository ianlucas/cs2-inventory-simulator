/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from "vitest";
import {
  isViewerIdSupported,
  isViewerItemSupported,
  toViewerItem,
  viewerItemIds
} from "./cs2-viewer";

// A small manifest: max renderable id 100, with two removed/never-assigned ranges below it.
const catalog = {
  maxId: 100,
  holes: [
    [10, 12],
    [20, 20]
  ] as [number, number][]
};

describe("isViewerIdSupported", () => {
  it("fails closed when the manifest is absent", () => {
    // No manifest (endpoint down / not yet fetched) => nothing is offered in 3D.
    expect(isViewerIdSupported(undefined, 5)).toBe(false);
  });

  it("supports ids in [0, maxId] that aren't in a hole", () => {
    expect(isViewerIdSupported(catalog, 0)).toBe(true);
    expect(isViewerIdSupported(catalog, 13)).toBe(true);
    expect(isViewerIdSupported(catalog, 100)).toBe(true);
  });

  it("rejects ids above maxId (host on a newer cs2-lib)", () => {
    expect(isViewerIdSupported(catalog, 101)).toBe(false);
  });

  it("rejects ids inside a hole, inclusive of both ends", () => {
    expect(isViewerIdSupported(catalog, 10)).toBe(false);
    expect(isViewerIdSupported(catalog, 11)).toBe(false);
    expect(isViewerIdSupported(catalog, 12)).toBe(false);
    expect(isViewerIdSupported(catalog, 20)).toBe(false);
    // Just outside the holes.
    expect(isViewerIdSupported(catalog, 9)).toBe(true);
    expect(isViewerIdSupported(catalog, 21)).toBe(true);
  });
});

describe("viewerItemIds", () => {
  it("returns the weapon id plus every applied sticker id", () => {
    expect(
      viewerItemIds({ id: 7, stickers: { "0": { id: 30 }, "2": { id: 40 } } })
    ).toEqual([7, 30, 40]);
  });

  it("returns just the weapon id when there are no stickers", () => {
    expect(viewerItemIds({ id: 7 })).toEqual([7]);
  });
});

describe("toViewerItem", () => {
  it("passes statTrak and nameTag through to the viewer payload", () => {
    expect(
      toViewerItem({ id: 7, statTrak: 42, nameTag: "My Gun" })
    ).toEqual({ id: 7, statTrak: 42, nameTag: "My Gun" });
  });

  it("keeps statTrak: 0 (StatTrak enabled, zero kills)", () => {
    expect(toViewerItem({ id: 7, statTrak: 0 })).toEqual({
      id: 7,
      statTrak: 0
    });
  });

  it("drops statTrak and nameTag when undefined so the viewer keeps its defaults", () => {
    const viewerItem = toViewerItem({ id: 7 });
    expect(viewerItem).toEqual({ id: 7 });
    expect("statTrak" in viewerItem).toBe(false);
    expect("nameTag" in viewerItem).toBe(false);
  });
});

describe("isViewerItemSupported", () => {
  it("requires the weapon AND all its stickers to be renderable", () => {
    expect(
      isViewerItemSupported(catalog, { id: 5, stickers: { "0": { id: 50 } } })
    ).toBe(true);
    // A sticker beyond maxId blocks the whole item (edit falls back to 2D).
    expect(
      isViewerItemSupported(catalog, { id: 5, stickers: { "0": { id: 200 } } })
    ).toBe(false);
    // The weapon itself sitting in a hole blocks it.
    expect(isViewerItemSupported(catalog, { id: 11 })).toBe(false);
  });

  it("fails closed without a manifest", () => {
    expect(isViewerItemSupported(undefined, { id: 5 })).toBe(false);
  });
});
