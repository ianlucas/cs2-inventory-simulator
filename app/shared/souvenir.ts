/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2SouvenirSource,
  ensure
} from "@ianlucas/cs2-lib";
import { shuffle } from "./misc";
import { range } from "./number";

type Keychains = NonNullable<CS2BaseInventoryItem["keychains"]>;
type Stickers = NonNullable<CS2BaseInventoryItem["stickers"]>;

export type SouvenirStickerField =
  "autograph" | "event" | "map" | "team0" | "team1";

export interface SouvenirSelection {
  autographId?: number;
  eventStickerId?: number;
  highlightId?: number;
  mapStickerId?: number;
  order: SouvenirStickerField[];
  slots: number[];
  sourceIndex: number;
  teamIds: [number | undefined, number | undefined];
}

export function getNewestSouvenirSourceIndex(sources: CS2SouvenirSource[]) {
  return sources.reduce(
    (newest, source, index) =>
      source.eventId > ensure(sources[newest]).eventId ? index : newest,
    0
  );
}

export function getSouvenirSourceName(source: CS2SouvenirSource) {
  return source.container?.name ?? source.teams[0]?.sticker.categoryName ?? "";
}

export function getSouvenirSourceImage(source: CS2SouvenirSource) {
  return source.container ?? source.teams[0]?.sticker;
}

export function hasSouvenirAutographs(source: CS2SouvenirSource) {
  return source.teams.some(({ autographs }) => autographs.length > 0);
}

export function getSouvenirStickerFields(
  source: CS2SouvenirSource
): SouvenirStickerField[] {
  return [
    ...(source.teams.length > 0 ? (["team0", "team1"] as const) : []),
    ...(source.eventStickers.length > 0 ? (["event"] as const) : []),
    ...(hasSouvenirAutographs(source) ? (["autograph"] as const) : []),
    ...(source.mapStickers.length > 0 ? (["map"] as const) : [])
  ];
}

export function createSouvenirSelection(
  sources: CS2SouvenirSource[],
  sourceIndex: number
): SouvenirSelection {
  const source = ensure(sources[sourceIndex]);
  const order = getSouvenirStickerFields(source);
  return {
    eventStickerId: source.eventStickers[0]?.id,
    mapStickerId: isSouvenirMapFixed(source)
      ? source.mapStickers[0]?.id
      : undefined,
    order,
    slots: range(order.length),
    sourceIndex,
    teamIds: [undefined, undefined]
  };
}

export function isSouvenirMapFixed(source: CS2SouvenirSource) {
  return source.container !== undefined;
}

function getTeam(source: CS2SouvenirSource, teamId: number | undefined) {
  return source.teams.find(({ id }) => id === teamId);
}

export function getSouvenirAutographs(
  source: CS2SouvenirSource,
  { teamIds }: SouvenirSelection
): CS2EconomyItem[] {
  if (teamIds.some((teamId) => teamId === undefined)) {
    return [];
  }
  return teamIds.flatMap((teamId) => getTeam(source, teamId)?.autographs ?? []);
}

export function isSouvenirSelectionComplete(
  source: CS2SouvenirSource,
  selection: SouvenirSelection
) {
  const [teamA, teamB] = selection.teamIds;
  return (
    teamA !== undefined &&
    teamB !== undefined &&
    teamA !== teamB &&
    (getSouvenirAutographs(source, selection).length === 0 ||
      selection.autographId !== undefined) &&
    (source.eventStickers.length === 0 ||
      selection.eventStickerId !== undefined) &&
    (source.mapStickers.length === 0 || selection.mapStickerId !== undefined) &&
    (source.highlights.length === 0 || selection.highlightId !== undefined)
  );
}

function keepAutograph(
  source: CS2SouvenirSource,
  selection: SouvenirSelection
): SouvenirSelection {
  return getSouvenirAutographs(source, selection).some(
    ({ id }) => id === selection.autographId
  )
    ? selection
    : { ...selection, autographId: undefined };
}

export function selectSouvenirTeam(
  source: CS2SouvenirSource,
  selection: SouvenirSelection,
  index: 0 | 1,
  teamId: number
): SouvenirSelection {
  const teamIds: SouvenirSelection["teamIds"] = [...selection.teamIds];
  teamIds[index] = teamId;
  return keepAutograph(source, { ...selection, teamIds });
}

export function selectSouvenirHighlight(
  source: CS2SouvenirSource,
  selection: SouvenirSelection,
  highlightId: number
): SouvenirSelection {
  const [teamA, teamB] = ensure(
    CS2Economy.getById(highlightId).teamStickerIds
  ).map(
    (stickerId) =>
      ensure(source.teams.find(({ sticker }) => sticker.id === stickerId)).id
  );
  return keepAutograph(source, {
    ...selection,
    highlightId,
    teamIds: [teamA, teamB]
  });
}

export function getSouvenirStickers(
  source: CS2SouvenirSource,
  selection: SouvenirSelection
): Stickers {
  const find = (items: CS2EconomyItem[], id: number | undefined) =>
    items.find((item) => item.id === id)?.id;
  const ids: Record<SouvenirStickerField, number | undefined> = {
    autograph: find(
      getSouvenirAutographs(source, selection),
      selection.autographId
    ),
    event: find(source.eventStickers, selection.eventStickerId),
    map: find(source.mapStickers, selection.mapStickerId),
    team0: getTeam(source, selection.teamIds[0])?.sticker.id,
    team1: getTeam(source, selection.teamIds[1])?.sticker.id
  };
  const stickers: Stickers = {};
  selection.order.forEach((field, index) => {
    const id = ids[field];
    if (id !== undefined) {
      stickers[Object.keys(stickers).length] = {
        id,
        schema: selection.slots[index]
      };
    }
  });
  return stickers;
}

export function moveSouvenirStickerField(
  selection: SouvenirSelection,
  from: number,
  to: number
): SouvenirSelection {
  const order = [...selection.order];
  const [field] = order.splice(from, 1);
  order.splice(to, 0, ensure(field));
  return { ...selection, order };
}

export function shuffleSouvenirStickers(
  selection: SouvenirSelection,
  schemaCount: number
): SouvenirSelection {
  const count = selection.order.length;
  return {
    ...selection,
    order: shuffle(selection.order),
    slots: shuffle(range(Math.max(schemaCount, count)))
      .slice(0, count)
      .sort((a, b) => a - b)
  };
}

export function getSouvenirKeychains(
  item: CS2EconomyItem,
  keychains: Keychains,
  selection: SouvenirSelection
): Keychains {
  if (selection.highlightId === undefined) {
    return {};
  }
  const highlight = CS2Economy.getById(selection.highlightId);
  const { highlight: current, x, y, z } = keychains[0] ?? {};
  const position =
    current !== undefined &&
    x !== undefined &&
    y !== undefined &&
    z !== undefined
      ? { x, y, z }
      : item.rollKeychainDefaultPosition();
  return {
    0: { highlight: highlight.id, id: ensure(highlight.parentId), ...position }
  };
}

function readSouvenirSelection(
  source: CS2SouvenirSource,
  sourceIndex: number,
  stickers: Stickers,
  keychains: Keychains
): SouvenirSelection | undefined {
  const selection: SouvenirSelection = {
    order: [],
    slots: [],
    sourceIndex,
    teamIds: [undefined, undefined]
  };
  const placed = new Map<SouvenirStickerField, number>();
  const teamIds: number[] = [];
  let autographTeamId: number | undefined;
  for (const [key, { id, schema }] of Object.entries(stickers)) {
    const slot = schema ?? Number(key);
    const logo = source.teams.find(({ sticker }) => sticker.id === id);
    const signer = source.teams.find(({ autographs }) =>
      autographs.some((autograph) => autograph.id === id)
    );
    if (source.eventStickers.some((sticker) => sticker.id === id)) {
      if (selection.eventStickerId !== undefined) {
        return undefined;
      }
      selection.eventStickerId = id;
      placed.set("event", slot);
    } else if (source.mapStickers.some((sticker) => sticker.id === id)) {
      if (selection.mapStickerId !== undefined) {
        return undefined;
      }
      selection.mapStickerId = id;
      placed.set("map", slot);
    } else if (logo !== undefined && !teamIds.includes(logo.id)) {
      if (teamIds.length === 2) {
        return undefined;
      }
      placed.set(teamIds.length === 0 ? "team0" : "team1", slot);
      teamIds.push(logo.id);
    } else if (signer !== undefined && selection.autographId === undefined) {
      selection.autographId = id;
      autographTeamId = signer.id;
      placed.set("autograph", slot);
    } else {
      return undefined;
    }
  }
  if (autographTeamId !== undefined && !teamIds.includes(autographTeamId)) {
    teamIds.push(autographTeamId);
  }
  if (teamIds.length > 2) {
    return undefined;
  }
  selection.teamIds = [teamIds[0], teamIds[1]];
  if (isSouvenirMapFixed(source)) {
    selection.mapStickerId ??= source.mapStickers[0]?.id;
  }
  if (source.eventStickers.length === 1) {
    selection.eventStickerId ??= source.eventStickers[0]?.id;
  }
  const highlightId = keychains[0]?.highlight;
  if (source.highlights.some(({ id }) => id === highlightId)) {
    selection.highlightId = highlightId;
  }
  const used = new Set(placed.values());
  const fields = getSouvenirStickerFields(source).map((field) => {
    let slot = placed.get(field);
    if (slot === undefined) {
      slot = range(used.size + 1).find((free) => !used.has(free)) ?? 0;
      used.add(slot);
    }
    return { field, slot };
  });
  fields.sort((a, b) => a.slot - b.slot);
  selection.order = fields.map(({ field }) => field);
  selection.slots = fields.map(({ slot }) => slot);
  return selection;
}

export function findSouvenirSelection(
  sources: CS2SouvenirSource[],
  stickers: Stickers,
  keychains: Keychains
): SouvenirSelection {
  const newest = createSouvenirSelection(
    sources,
    getNewestSouvenirSourceIndex(sources)
  );
  if (Object.keys(stickers).length === 0) {
    return newest;
  }
  const highlightId = keychains[0]?.highlight;
  const hasHighlight = ({ highlights }: CS2SouvenirSource) =>
    highlights.some(({ id }) => id === highlightId);
  const entries = [...sources.entries()];
  for (const [index, source] of [
    ...entries.filter(([, source]) => hasHighlight(source)),
    ...entries.filter(([, source]) => !hasHighlight(source))
  ]) {
    const selection = readSouvenirSelection(source, index, stickers, keychains);
    if (selection !== undefined) {
      return selection;
    }
  }
  return newest;
}
