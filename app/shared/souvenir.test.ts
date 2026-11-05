/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2Inventory,
  CS2SouvenirSource,
  ensure
} from "@ianlucas/cs2-lib";
import { expect, test } from "vitest";
import { loadEconomy } from "~/test-utils";
import {
  createSouvenirSelection,
  findSouvenirSelection,
  getNewestSouvenirSourceIndex,
  getSouvenirAutographs,
  getSouvenirKeychains,
  getSouvenirSourceName,
  getSouvenirStickers,
  isSouvenirSelectionComplete,
  moveSouvenirStickerField,
  selectSouvenirHighlight,
  selectSouvenirTeam,
  shuffleSouvenirStickers,
  SouvenirSelection
} from "./souvenir";

loadEconomy();

const FENNEC_FOX_ID = 91;
const URBAN_DDPAT_ID = 66;
const MUDDER_ID = 70;

function sourcesOf(id: number) {
  return CS2Economy.getById(id).getSouvenirSources();
}

function indexOf(
  sources: CS2SouvenirSource[],
  predicate: (source: CS2SouvenirSource) => boolean
) {
  const index = sources.findIndex(predicate);
  expect(index).toBeGreaterThanOrEqual(0);
  return index;
}

function complete(source: CS2SouvenirSource, selection: SouvenirSelection) {
  let next = selectSouvenirTeam(source, selection, 0, source.teams[0].id);
  next = selectSouvenirTeam(source, next, 1, source.teams[1].id);
  next = {
    ...next,
    autographId: getSouvenirAutographs(source, next)[0]?.id,
    mapStickerId: next.mapStickerId ?? source.mapStickers[0]?.id
  };
  return next;
}

function canAdd(id: number, stickers: ReturnType<typeof getSouvenirStickers>) {
  const inventory = new CS2Inventory();
  return () => inventory.add({ id, souvenir: true, stickers });
}

function placementOf(stickers: ReturnType<typeof getSouvenirStickers>) {
  return Object.values(stickers)
    .map(({ id, schema }) => [id, schema])
    .sort(([a], [b]) => (a ?? 0) - (b ?? 0));
}

function highlightSelection() {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const index = indexOf(sources, ({ highlights }) => highlights.length > 0);
  const source = sources[index];
  return {
    source,
    sources,
    selection: selectSouvenirHighlight(
      source,
      complete(source, createSouvenirSelection(sources, index)),
      source.highlights[0].id
    )
  };
}

test("the newest source is preselected", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const newest = sources[getNewestSouvenirSourceIndex(sources)];
  expect(newest.container).toBeUndefined();
  expect(getSouvenirSourceName(newest)).toBe("IEM Cologne 2026");
});

test("a crafted source needs two teams, an autograph and a map", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const index = getNewestSouvenirSourceIndex(sources);
  const source = sources[index];
  const selection = createSouvenirSelection(sources, index);
  expect(selection.mapStickerId).toBeUndefined();
  expect(isSouvenirSelectionComplete(source, selection)).toBe(false);
  const teams = selectSouvenirTeam(
    source,
    selectSouvenirTeam(source, selection, 0, source.teams[0].id),
    1,
    source.teams[1].id
  );
  expect(isSouvenirSelectionComplete(source, teams)).toBe(false);
  const done = complete(source, selection);
  expect(isSouvenirSelectionComplete(source, done)).toBe(true);
  const stickers = getSouvenirStickers(source, done);
  expect(Object.keys(stickers)).toHaveLength(4);
  expect(canAdd(FENNEC_FOX_ID, stickers)).not.toThrow();
});

test("a partial selection previews the stickers picked so far", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const index = getNewestSouvenirSourceIndex(sources);
  const source = sources[index];
  const selection = selectSouvenirTeam(
    source,
    createSouvenirSelection(sources, index),
    1,
    source.teams[3].id
  );
  expect(getSouvenirStickers(source, selection)).toEqual({
    0: { id: source.teams[3].sticker.id, schema: 1 }
  });
});

test("the stickers follow the fields' order into the fields' slots", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const index = getNewestSouvenirSourceIndex(sources);
  const source = sources[index];
  const done = complete(source, createSouvenirSelection(sources, index));
  expect(done.order).toEqual(["team0", "team1", "autograph", "map"]);
  expect(done.slots).toEqual([0, 1, 2, 3]);
  const moved = moveSouvenirStickerField(done, 3, 0);
  expect(moved.order).toEqual(["map", "team0", "team1", "autograph"]);
  expect(placementOf(getSouvenirStickers(source, moved))).toEqual(
    placementOf({
      0: { id: ensure(done.mapStickerId), schema: 0 },
      1: { id: source.teams[0].sticker.id, schema: 1 },
      2: { id: source.teams[1].sticker.id, schema: 2 },
      3: { id: ensure(done.autographId), schema: 3 }
    })
  );
  expect(
    canAdd(FENNEC_FOX_ID, getSouvenirStickers(source, moved))
  ).not.toThrow();
});

test("shuffling places the stickers in distinct random slots of the weapon", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const index = getNewestSouvenirSourceIndex(sources);
  const source = sources[index];
  const done = complete(source, createSouvenirSelection(sources, index));
  const orders = new Set<string>();
  const slots = new Set<number>();
  for (let roll = 0; roll < 200; roll++) {
    const shuffled = shuffleSouvenirStickers(done, 6);
    expect([...shuffled.order].sort()).toEqual([...done.order].sort());
    expect(new Set(shuffled.slots).size).toBe(4);
    expect(shuffled.slots).toEqual([...shuffled.slots].sort((a, b) => a - b));
    expect(shuffled.slots.every((slot) => slot >= 0 && slot < 6)).toBe(true);
    orders.add(shuffled.order.join());
    shuffled.slots.forEach((slot) => slots.add(slot));
  }
  expect(orders.size).toBeGreaterThan(1);
  expect(slots).toEqual(new Set([0, 1, 2, 3, 4, 5]));
});

test("the same team can't be picked twice", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const index = getNewestSouvenirSourceIndex(sources);
  const source = sources[index];
  const done = complete(source, createSouvenirSelection(sources, index));
  expect(
    isSouvenirSelectionComplete(
      source,
      selectSouvenirTeam(source, done, 1, source.teams[0].id)
    )
  ).toBe(false);
});

test("autographs only list players from both chosen teams", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const index = getNewestSouvenirSourceIndex(sources);
  const source = sources[index];
  const selection = createSouvenirSelection(sources, index);
  const one = selectSouvenirTeam(source, selection, 0, source.teams[0].id);
  expect(getSouvenirAutographs(source, one)).toEqual([]);
  const both = selectSouvenirTeam(source, one, 1, source.teams[1].id);
  expect(getSouvenirAutographs(source, both)).toEqual([
    ...source.teams[0].autographs,
    ...source.teams[1].autographs
  ]);
});

test("changing a team drops an autograph from the old team", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const index = getNewestSouvenirSourceIndex(sources);
  const source = sources[index];
  const done = complete(source, createSouvenirSelection(sources, index));
  expect(done.autographId).toBe(source.teams[0].autographs[0].id);
  const changed = selectSouvenirTeam(source, done, 0, source.teams[2].id);
  expect(changed.autographId).toBeUndefined();
});

test("a package source has its map fixed", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const index = indexOf(sources, ({ container }) => container !== undefined);
  const selection = createSouvenirSelection(sources, index);
  expect(selection.mapStickerId).toBe(sources[index].mapStickers[0].id);
});

test("an older package needs an autograph but carries no map", () => {
  const sources = sourcesOf(URBAN_DDPAT_ID);
  const index = indexOf(
    sources,
    ({ container, teams }) =>
      container !== undefined && teams[0].autographs.length > 0
  );
  const source = sources[index];
  const done = complete(source, createSouvenirSelection(sources, index));
  expect(done.mapStickerId).toBeUndefined();
  expect(isSouvenirSelectionComplete(source, done)).toBe(true);
  expect(
    isSouvenirSelectionComplete(source, { ...done, autographId: undefined })
  ).toBe(false);
  expect(
    canAdd(URBAN_DDPAT_ID, getSouvenirStickers(source, done))
  ).not.toThrow();
});

test("a package's single event sticker is a field of its own", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const index = indexOf(
    sources,
    ({ container, highlights }) =>
      container !== undefined && highlights.length === 0
  );
  expect(createSouvenirSelection(sources, index).order).toEqual([
    "team0",
    "team1",
    "event",
    "map"
  ]);
});

test("the first of several event stickers is preselected", () => {
  const sources = sourcesOf(MUDDER_ID);
  const index = indexOf(
    sources,
    ({ eventStickers }) => eventStickers.length > 1
  );
  expect(createSouvenirSelection(sources, index).eventStickerId).toBe(
    sources[index].eventStickers[0].id
  );
});

test("a highlight sets its teams", () => {
  const { selection, source } = highlightSelection();
  const highlight = source.highlights[0];
  expect(
    selection.teamIds.map(
      (teamId) => source.teams.find(({ id }) => id === teamId)?.sticker.id
    )
  ).toEqual(highlight.teamStickerIds);
});

test("a highlight package needs a highlight", () => {
  const { selection, source } = highlightSelection();
  expect(isSouvenirSelectionComplete(source, selection)).toBe(true);
  expect(
    isSouvenirSelectionComplete(source, {
      ...selection,
      highlightId: undefined
    })
  ).toBe(false);
});

test("a highlight's charm sits at the weapon's default charm location", () => {
  const { selection } = highlightSelection();
  const item = CS2Economy.getById(FENNEC_FOX_ID);
  const highlight = CS2Economy.getById(ensure(selection.highlightId));
  const keychains = getSouvenirKeychains(item, { 1: { id: 999 } }, selection);
  expect(Object.keys(keychains)).toEqual(["0"]);
  expect(keychains[0]).toMatchObject({
    highlight: highlight.id,
    id: highlight.parentId
  });
  const { x, y, z } = ensure(keychains[0]);
  expect([x, y, z].every((axis) => axis !== undefined)).toBe(true);
  expect(getSouvenirKeychains(item, keychains, selection)).toEqual(keychains);
});

test("a souvenir without a highlight carries no charm", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const index = getNewestSouvenirSourceIndex(sources);
  const item = CS2Economy.getById(FENNEC_FOX_ID);
  expect(
    getSouvenirKeychains(
      item,
      { 0: { id: 999 } },
      createSouvenirSelection(sources, index)
    )
  ).toEqual({});
});

test("an existing souvenir is read back from its stickers", () => {
  const { selection, sources } = highlightSelection();
  const item = CS2Economy.getById(FENNEC_FOX_ID);
  const source = sources[selection.sourceIndex];
  const stickers = getSouvenirStickers(source, selection);
  const keychains = getSouvenirKeychains(item, {}, selection);
  expect(findSouvenirSelection(sources, stickers, keychains)).toEqual(
    selection
  );
});

test("a shuffled souvenir is read back in its slots", () => {
  const { selection, sources } = highlightSelection();
  const source = sources[selection.sourceIndex];
  for (let roll = 0; roll < 50; roll++) {
    const shuffled = shuffleSouvenirStickers(selection, 5);
    const stickers = getSouvenirStickers(source, shuffled);
    const found = findSouvenirSelection(sources, stickers, {});
    expect(placementOf(getSouvenirStickers(source, found))).toEqual(
      placementOf(stickers)
    );
  }
});

test("a scraped souvenir is read back with its missing slots empty", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  const index = getNewestSouvenirSourceIndex(sources);
  const source = sources[index];
  const done = complete(source, createSouvenirSelection(sources, index));
  const stickers = getSouvenirStickers(source, done);
  const scraped = { 0: ensure(stickers[0]), 1: ensure(stickers[1]) };
  const found = findSouvenirSelection(sources, scraped, {});
  expect(found.sourceIndex).toBe(index);
  expect(found.teamIds).toEqual(done.teamIds);
  expect(found.autographId).toBeUndefined();
  expect(found.mapStickerId).toBeUndefined();
  expect(found.order).toEqual(done.order);
  expect(found.slots).toEqual(done.slots);
  expect(isSouvenirSelectionComplete(source, found)).toBe(false);
});

test("stickers that fit no source fall back to the newest source", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  expect(
    findSouvenirSelection(sources, { 0: { id: FENNEC_FOX_ID } }, {})
  ).toEqual(
    createSouvenirSelection(sources, getNewestSouvenirSourceIndex(sources))
  );
});

test("a souvenir without stickers is read back as the newest source", () => {
  const sources = sourcesOf(FENNEC_FOX_ID);
  expect(findSouvenirSelection(sources, {}, {})).toEqual(
    createSouvenirSelection(sources, getNewestSouvenirSourceIndex(sources))
  );
});
