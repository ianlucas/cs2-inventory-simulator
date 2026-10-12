/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2Team,
  ensure
} from "@ianlucas/cs2-lib";
import {
  LOADOUT_DEFAULT_WEAPONS,
  LOADOUT_STARTING_PISTOLS,
  LoadoutTeam,
  getDefaultAgent,
  getDefaultGloves,
  getDefaultMelee,
  getDefaultWeapon
} from "./loadout-defaults";

export type { LoadoutTeam };

export interface LoadoutItem {
  type: "snapshot";
  item: CS2BaseInventoryItem;
}

export interface TeamLoadout {
  agent: LoadoutItem;
  gloves: LoadoutItem;
  melee: LoadoutItem;
  taser: LoadoutItem;
  c4?: LoadoutItem;
  secondary: LoadoutItem[];
  midTier: LoadoutItem[];
  rifle: LoadoutItem[];
}

export interface Loadout {
  ct: TeamLoadout;
  t: TeamLoadout;
  musicKit?: LoadoutItem;
  collectible?: LoadoutItem;
  graffiti?: LoadoutItem;
}

const LOADOUT_COLUMNS = ["secondary", "smg", "rifle"] as const;
export type LoadoutColumn = (typeof LOADOUT_COLUMNS)[number];
export type LoadoutGridSlot = `${LoadoutColumn}${0 | 1 | 2 | 3 | 4}`;

const LOADOUT_SIDE_SLOTS = [
  "customplayer",
  "clothing_hands",
  "melee",
  "equipment2",
  "c4",
  "musickit",
  "flair0",
  "spray0"
] as const;
export type LoadoutSideSlot = (typeof LOADOUT_SIDE_SLOTS)[number];
export type LoadoutSlot = LoadoutSideSlot | LoadoutGridSlot;

export const LOADOUT_GROUPS = [
  "secondary0",
  "secondary",
  "smg",
  "rifle",
  "customplayer",
  "clothing_hands",
  "melee",
  "equipment2",
  "c4",
  "musickit",
  "flair0",
  "spray0"
] as const;
export type LoadoutGroup = (typeof LOADOUT_GROUPS)[number];

const COLUMN_KEYS = {
  secondary: "secondary",
  smg: "midTier",
  rifle: "rifle"
} as const;

const TEAM_SIDE_KEYS = {
  customplayer: "agent",
  clothing_hands: "gloves",
  melee: "melee",
  equipment2: "taser",
  c4: "c4"
} as const;

const SHARED_SIDE_KEYS = {
  musickit: "musicKit",
  flair0: "collectible",
  spray0: "graffiti"
} as const;

type SharedSideSlot = keyof typeof SHARED_SIDE_KEYS;
type TeamSideSlot = keyof typeof TEAM_SIDE_KEYS;

function isSharedSlot(slot: LoadoutSlot): slot is SharedSideSlot {
  return slot in SHARED_SIDE_KEYS;
}

export function isGridSlot(slot: LoadoutSlot): slot is LoadoutGridSlot {
  return parseGridSlot(slot) !== undefined;
}

function parseGridSlot(slot: LoadoutSlot) {
  const match = slot.match(/^(secondary|smg|rifle)(\d)$/);
  return match !== null
    ? { column: match[1] as LoadoutColumn, index: Number(match[2]) }
    : undefined;
}

function getTeamKey(team: LoadoutTeam) {
  return team === CS2Team.CT ? "ct" : "t";
}

export function getGridSlots(column: LoadoutColumn) {
  return [0, 1, 2, 3, 4].map((index) => `${column}${index}` as LoadoutGridSlot);
}

export function getSideSlots(team: LoadoutTeam) {
  return LOADOUT_SIDE_SLOTS.filter(
    (slot) => slot !== "c4" || team === CS2Team.T
  );
}

export function getItemGroup(item: CS2EconomyItem): LoadoutGroup | undefined {
  if (item.isPistol()) {
    return item.modelKey !== undefined &&
      LOADOUT_STARTING_PISTOLS.includes(item.modelKey)
      ? "secondary0"
      : "secondary";
  }
  if (item.isInMidTiers()) {
    return "smg";
  }
  if (item.isInRifles()) {
    return "rifle";
  }
  if (item.isEquipment()) {
    return "equipment2";
  }
  if (item.isC4()) {
    return "c4";
  }
  if (item.isAgent()) {
    return "customplayer";
  }
  if (item.isGloves()) {
    return "clothing_hands";
  }
  if (item.isMelee()) {
    return "melee";
  }
  if (item.isMusicKit()) {
    return "musickit";
  }
  if (item.isCollectible()) {
    return "flair0";
  }
  if (item.isGraffiti()) {
    return "spray0";
  }
  return undefined;
}

export function getSlotGroup(slot: LoadoutSlot): LoadoutGroup {
  const grid = parseGridSlot(slot);
  if (grid === undefined) {
    return slot as LoadoutSideSlot;
  }
  if (grid.column === "secondary") {
    return grid.index === 0 ? "secondary0" : "secondary";
  }
  return grid.column;
}

export function isUsableByTeam(item: CS2EconomyItem, team: LoadoutTeam) {
  return item.teams === undefined || item.teams.includes(team);
}

export function canPlace(
  team: LoadoutTeam,
  slot: LoadoutSlot,
  item: CS2EconomyItem
) {
  return (
    getItemGroup(item) === getSlotGroup(slot) && isUsableByTeam(item, team)
  );
}

export function resolveSideSlot(team: LoadoutTeam, item: CS2EconomyItem) {
  return getSideSlots(team).find((slot) => canPlace(team, slot, item));
}

export function getLoadoutItem(
  loadout: Loadout,
  team: LoadoutTeam,
  slot: LoadoutSlot
): LoadoutItem | undefined {
  if (isSharedSlot(slot)) {
    return loadout[SHARED_SIDE_KEYS[slot]];
  }
  const teamLoadout = loadout[getTeamKey(team)];
  const grid = parseGridSlot(slot);
  return grid !== undefined
    ? teamLoadout[COLUMN_KEYS[grid.column]][grid.index]
    : teamLoadout[TEAM_SIDE_KEYS[slot as TeamSideSlot]];
}

function setLoadoutItem(
  loadout: Loadout,
  team: LoadoutTeam,
  slot: LoadoutSlot,
  item: LoadoutItem
): Loadout {
  if (isSharedSlot(slot)) {
    return { ...loadout, [SHARED_SIDE_KEYS[slot]]: item };
  }
  const teamKey = getTeamKey(team);
  const teamLoadout = { ...loadout[teamKey] };
  const grid = parseGridSlot(slot);
  if (grid !== undefined) {
    const key = COLUMN_KEYS[grid.column];
    teamLoadout[key] = teamLoadout[key].map((current, index) =>
      index === grid.index ? item : current
    );
  } else {
    teamLoadout[TEAM_SIDE_KEYS[slot as TeamSideSlot]] = item;
  }
  return { ...loadout, [teamKey]: teamLoadout };
}

export function createSnapshot({
  charges,
  id,
  keychains,
  nameTag,
  patches,
  seed,
  statTrak,
  stickers,
  style,
  upgradeLevel,
  wear
}: CS2BaseInventoryItem): LoadoutItem {
  const item: CS2BaseInventoryItem = {
    charges,
    id,
    keychains,
    nameTag,
    patches,
    seed,
    statTrak,
    stickers,
    style,
    upgradeLevel,
    wear
  };
  return {
    type: "snapshot",
    item: Object.fromEntries(
      Object.entries(item).filter(([, value]) => value !== undefined)
    ) as CS2BaseInventoryItem
  };
}

export function getEconomyItem({ item }: LoadoutItem) {
  return CS2Economy.getById(item.id);
}

function hasAttributes({ item }: LoadoutItem) {
  return Object.keys(item).length > 1;
}

function isStock(loadoutItem: LoadoutItem) {
  return (
    getEconomyItem(loadoutItem).isDefault === true &&
    !hasAttributes(loadoutItem)
  );
}

function findWeaponSlot(
  loadout: Loadout,
  team: LoadoutTeam,
  item: CS2EconomyItem
) {
  const group = getItemGroup(item);
  return LOADOUT_COLUMNS.flatMap(getGridSlots).find((slot) => {
    const current = getLoadoutItem(loadout, team, slot);
    return (
      getSlotGroup(slot) === group &&
      current !== undefined &&
      getEconomyItem(current).modelKey === item.modelKey
    );
  });
}

export function place(
  loadout: Loadout,
  team: LoadoutTeam,
  slot: LoadoutSlot,
  item: CS2BaseInventoryItem
): { loadout: Loadout; swappedSlot?: LoadoutSlot } | undefined {
  if (!canPlace(team, slot, CS2Economy.getById(item.id))) {
    return undefined;
  }
  const snapshot = createSnapshot(item);
  const current = getLoadoutItem(loadout, team, slot);
  const weaponSlot = isGridSlot(slot)
    ? findWeaponSlot(loadout, team, CS2Economy.getById(item.id))
    : undefined;
  if (
    weaponSlot === undefined ||
    weaponSlot === slot ||
    current === undefined
  ) {
    return { loadout: setLoadoutItem(loadout, team, slot, snapshot) };
  }
  return {
    loadout: setLoadoutItem(
      setLoadoutItem(loadout, team, slot, snapshot),
      team,
      weaponSlot,
      current
    ),
    swappedSlot: weaponSlot
  };
}

function getDefaultItem(
  team: LoadoutTeam,
  slot: LoadoutSlot
): CS2EconomyItem | undefined {
  const grid = parseGridSlot(slot);
  if (grid !== undefined) {
    return getDefaultWeapon(
      LOADOUT_DEFAULT_WEAPONS[team][grid.column][grid.index]
    );
  }
  switch (slot) {
    case "customplayer":
      return getDefaultAgent(team);
    case "clothing_hands":
      return getDefaultGloves(team);
    case "melee":
      return getDefaultMelee(team);
    case "equipment2":
      return getDefaultWeapon("taser");
    case "c4":
      return team === CS2Team.T ? getDefaultWeapon("c4") : undefined;
  }
  return undefined;
}

function createTeamLoadout(team: LoadoutTeam): TeamLoadout {
  function createDefaultSnapshot(slot: LoadoutSlot) {
    return createSnapshot({ id: ensure(getDefaultItem(team, slot)).id });
  }
  return {
    agent: createDefaultSnapshot("customplayer"),
    gloves: createDefaultSnapshot("clothing_hands"),
    melee: createDefaultSnapshot("melee"),
    taser: createDefaultSnapshot("equipment2"),
    ...(team === CS2Team.T ? { c4: createDefaultSnapshot("c4") } : {}),
    secondary: getGridSlots("secondary").map(createDefaultSnapshot),
    midTier: getGridSlots("smg").map(createDefaultSnapshot),
    rifle: getGridSlots("rifle").map(createDefaultSnapshot)
  };
}

export function createDefaultLoadout(): Loadout {
  return {
    ct: createTeamLoadout(CS2Team.CT),
    t: createTeamLoadout(CS2Team.T)
  };
}

export function canResetSlot(
  loadout: Loadout,
  team: LoadoutTeam,
  slot: LoadoutSlot
) {
  const current = getLoadoutItem(loadout, team, slot);
  const defaultItem = getDefaultItem(team, slot);
  if (current === undefined || defaultItem === undefined) {
    return false;
  }
  return isGridSlot(slot)
    ? getEconomyItem(current).modelKey !== defaultItem.modelKey
    : current.item.id !== defaultItem.id || hasAttributes(current);
}

export function resetSlot(
  loadout: Loadout,
  team: LoadoutTeam,
  slot: LoadoutSlot
) {
  return place(loadout, team, slot, {
    id: ensure(getDefaultItem(team, slot)).id
  });
}

export function canResetSlotFinish(
  loadout: Loadout,
  team: LoadoutTeam,
  slot: LoadoutSlot
) {
  const current = getLoadoutItem(loadout, team, slot);
  return isGridSlot(slot) && current !== undefined && !isStock(current);
}

export function resetSlotFinish(
  loadout: Loadout,
  team: LoadoutTeam,
  slot: LoadoutSlot
) {
  const current = ensure(getLoadoutItem(loadout, team, slot));
  const modelKey = ensure(getEconomyItem(current).modelKey);
  return place(loadout, team, slot, { id: getDefaultWeapon(modelKey).id });
}

export function canRemoveSlot(
  loadout: Loadout,
  team: LoadoutTeam,
  slot: LoadoutSlot
) {
  return (
    isSharedSlot(slot) && getLoadoutItem(loadout, team, slot) !== undefined
  );
}

export function removeSlot(loadout: Loadout, slot: LoadoutSlot): Loadout {
  return isSharedSlot(slot)
    ? { ...loadout, [SHARED_SIDE_KEYS[slot]]: undefined }
    : loadout;
}
