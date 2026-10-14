/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2Inventory,
  CS2InventoryItem,
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

export type LoadoutItem =
  | { type: "inventory"; uid: number }
  | { type: "snapshot"; item: { id: number } };

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

export const LOADOUT_SLOTS: LoadoutSlot[] = [
  ...LOADOUT_SIDE_SLOTS,
  ...LOADOUT_COLUMNS.flatMap(getGridSlots)
];

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

// loadout_slot_t of each column's first slot.
const COLUMN_SLOT_IDS = {
  secondary: 2,
  smg: 8,
  rifle: 14
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

export function isSharedSlot(slot: LoadoutSlot): slot is SharedSideSlot {
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

export function getGridSlotId(slot: LoadoutSlot) {
  const grid = parseGridSlot(slot);
  return grid !== undefined
    ? COLUMN_SLOT_IDS[grid.column] + grid.index
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
    getItemGroup(item) === getSlotGroup(slot) &&
    isUsableByTeam(item, team) &&
    !(item instanceof CS2InventoryItem && item.isSealed())
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

export function createSnapshot(id: number): LoadoutItem {
  return { type: "snapshot", item: { id } };
}

export function createLoadoutItem(item: CS2InventoryItem): LoadoutItem {
  return item.uid >= 0
    ? { type: "inventory", uid: item.uid }
    : createSnapshot(item.id);
}

export function resolveLoadoutItem(
  inventory: CS2Inventory,
  loadoutItem: LoadoutItem
): CS2InventoryItem | CS2BaseInventoryItem {
  return loadoutItem.type === "inventory"
    ? inventory.get(loadoutItem.uid)
    : loadoutItem.item;
}

export function getEconomyItem(
  inventory: CS2Inventory,
  loadoutItem: LoadoutItem
): CS2EconomyItem {
  return loadoutItem.type === "inventory"
    ? inventory.get(loadoutItem.uid)
    : CS2Economy.getById(loadoutItem.item.id);
}

function findWeaponSlot(
  loadout: Loadout,
  inventory: CS2Inventory,
  team: LoadoutTeam,
  item: CS2EconomyItem
) {
  const group = getItemGroup(item);
  return LOADOUT_COLUMNS.flatMap(getGridSlots).find((slot) => {
    const current = getLoadoutItem(loadout, team, slot);
    return (
      getSlotGroup(slot) === group &&
      current !== undefined &&
      getEconomyItem(inventory, current).modelKey === item.modelKey
    );
  });
}

// The slot the loadout fills for an item and team, overriding what the inventory
// has equipped there: the item's side slot, or the grid slot holding its weapon.
// Items equipped for no team only have the shared slots.
export function findItemSlot(
  loadout: Loadout,
  inventory: CS2Inventory,
  team: LoadoutTeam | undefined,
  item: CS2EconomyItem
): LoadoutSlot | undefined {
  const group = getItemGroup(item);
  if (team === undefined) {
    return LOADOUT_SIDE_SLOTS.filter(isSharedSlot).find(
      (slot) => slot === group
    );
  }
  return (
    getSideSlots(team).find((slot) => slot === group) ??
    findWeaponSlot(loadout, inventory, team, item)
  );
}

export function place(
  loadout: Loadout,
  inventory: CS2Inventory,
  team: LoadoutTeam,
  slot: LoadoutSlot,
  loadoutItem: LoadoutItem
): { loadout: Loadout; swappedSlot?: LoadoutSlot } | undefined {
  const item = getEconomyItem(inventory, loadoutItem);
  if (
    !canPlace(team, slot, item) ||
    (loadoutItem.type === "snapshot" && item.isDefault !== true)
  ) {
    return undefined;
  }
  const current = getLoadoutItem(loadout, team, slot);
  const weaponSlot = isGridSlot(slot)
    ? findWeaponSlot(loadout, inventory, team, item)
    : undefined;
  if (
    weaponSlot === undefined ||
    weaponSlot === slot ||
    current === undefined
  ) {
    return { loadout: setLoadoutItem(loadout, team, slot, loadoutItem) };
  }
  return {
    loadout: setLoadoutItem(
      setLoadoutItem(loadout, team, slot, loadoutItem),
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
    return createSnapshot(ensure(getDefaultItem(team, slot)).id);
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
  inventory: CS2Inventory,
  team: LoadoutTeam,
  slot: LoadoutSlot
) {
  const current = getLoadoutItem(loadout, team, slot);
  const defaultItem = getDefaultItem(team, slot);
  if (current === undefined || defaultItem === undefined) {
    return false;
  }
  return isGridSlot(slot)
    ? getEconomyItem(inventory, current).modelKey !== defaultItem.modelKey
    : current.type === "inventory" || current.item.id !== defaultItem.id;
}

export function resetSlot(
  loadout: Loadout,
  inventory: CS2Inventory,
  team: LoadoutTeam,
  slot: LoadoutSlot
) {
  return place(
    loadout,
    inventory,
    team,
    slot,
    createSnapshot(ensure(getDefaultItem(team, slot)).id)
  );
}

export function canResetSlotFinish(
  loadout: Loadout,
  team: LoadoutTeam,
  slot: LoadoutSlot
) {
  const current = getLoadoutItem(loadout, team, slot);
  return isGridSlot(slot) && current?.type === "inventory";
}

export function resetSlotFinish(
  loadout: Loadout,
  inventory: CS2Inventory,
  team: LoadoutTeam,
  slot: LoadoutSlot
) {
  const current = ensure(getLoadoutItem(loadout, team, slot));
  const modelKey = ensure(getEconomyItem(inventory, current).modelKey);
  return place(
    loadout,
    inventory,
    team,
    slot,
    createSnapshot(getDefaultWeapon(modelKey).id)
  );
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

function getTeamSlots(team: LoadoutTeam) {
  return [...getSideSlots(team), ...LOADOUT_COLUMNS.flatMap(getGridSlots)];
}

export function getLoadoutEntries(loadout: Loadout) {
  return [CS2Team.CT, CS2Team.T].flatMap((team) =>
    getTeamSlots(team).flatMap((slot) => {
      const item = getLoadoutItem(loadout, team, slot);
      return item !== undefined ? [{ item, slot, team }] : [];
    })
  );
}

function getInventoryRefs(loadout: Loadout) {
  return getLoadoutEntries(loadout).flatMap(({ item, slot, team }) =>
    item.type === "inventory" ? [{ slot, team, uid: item.uid }] : []
  );
}

export function getInventoryItemIds(inventory: CS2Inventory) {
  return new Map(inventory.getAll().map(({ id, uid }) => [uid, id]));
}

export function getLoadoutItemEquipped(loadout: Loadout, uid: number) {
  const refs = getInventoryRefs(loadout).filter((ref) => ref.uid === uid);
  function isEquippedBy(team: LoadoutTeam) {
    return refs.some((ref) => ref.team === team && !isSharedSlot(ref.slot));
  }
  return {
    equipped: refs.some(({ slot }) => isSharedSlot(slot)),
    equippedCT: isEquippedBy(CS2Team.CT),
    equippedT: isEquippedBy(CS2Team.T)
  };
}

// An inventory item is gone once its uid is missing or now holds another item,
// since uids are reused. Its slot falls back like the game does when a skin is
// traded away: grid weapons keep their stock finish, other slots their default.
export function detachItems(
  loadout: Loadout,
  itemIds: Map<number, number>,
  previousItemIds: Map<number, number>
) {
  return getInventoryRefs(loadout).reduce((current, { slot, team, uid }) => {
    const previousId = previousItemIds.get(uid);
    if (
      itemIds.has(uid) &&
      (previousId === undefined || previousId === itemIds.get(uid))
    ) {
      return current;
    }
    if (isSharedSlot(slot)) {
      return removeSlot(current, slot);
    }
    const modelKey =
      previousId !== undefined
        ? CS2Economy.getById(previousId).modelKey
        : undefined;
    const fallback =
      isGridSlot(slot) && modelKey !== undefined
        ? getDefaultWeapon(modelKey)
        : ensure(getDefaultItem(team, slot));
    return setLoadoutItem(current, team, slot, createSnapshot(fallback.id));
  }, loadout);
}

function findEquippedItem(
  inventory: CS2Inventory,
  team: LoadoutTeam,
  slot: LoadoutSlot,
  modelKey?: string
) {
  return inventory
    .getAll()
    .find(
      (item) =>
        (isSharedSlot(slot)
          ? item.equipped
          : team === CS2Team.CT
            ? item.equippedCT
            : item.equippedT) === true &&
        canPlace(team, slot, item) &&
        (modelKey === undefined || item.modelKey === modelKey)
    );
}

// Grid slots keep their weapon and take the finish equipped for it, falling
// back to stock like `detachItems` when nothing is equipped.
export function importEquipped(
  loadout: Loadout,
  inventory: CS2Inventory
): Loadout {
  return [CS2Team.CT, CS2Team.T].reduce(
    (current, team) =>
      getTeamSlots(team).reduce((next, slot) => {
        const modelKey = isGridSlot(slot)
          ? getEconomyItem(inventory, ensure(getLoadoutItem(next, team, slot)))
              .modelKey
          : undefined;
        const equipped = findEquippedItem(inventory, team, slot, modelKey);
        if (equipped !== undefined) {
          return setLoadoutItem(next, team, slot, createLoadoutItem(equipped));
        }
        if (isSharedSlot(slot)) {
          return removeSlot(next, slot);
        }
        const fallback =
          modelKey !== undefined
            ? getDefaultWeapon(modelKey)
            : ensure(getDefaultItem(team, slot));
        return setLoadoutItem(next, team, slot, createSnapshot(fallback.id));
      }, current),
    loadout
  );
}
