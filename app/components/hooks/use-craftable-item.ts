/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_MIN_SEED,
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2ItemType
} from "@ianlucas/cs2-lib";
import { isItemCountable } from "~/utils/economy";
import { useInventory, useRules } from "../app-context";
import { useIsItemCraftable } from "./use-is-item-craftable";

export function useCraftableItem({
  attributes: { nameTag, patches, seed, statTrak, stickers, wear },
  item,
  type
}: {
  attributes: {
    nameTag: string;
    patches: NonNullable<CS2BaseInventoryItem["patches"]>;
    seed: number;
    statTrak: boolean;
    stickers: NonNullable<CS2BaseInventoryItem["stickers"]>;
    wear: number;
  };
  item: CS2EconomyItem;
  type: "craft" | "edit" | "share";
}) {
  const {
    craftAllowNametag,
    craftAllowPatches,
    craftAllowSeed,
    craftAllowStatTrak,
    craftAllowStickers,
    craftAllowWear,
    craftHideType,
    editAllowNametag,
    editAllowPatches,
    editAllowSeed,
    editAllowStatTrak,
    editAllowStickers,
    editAllowWear,
    editHideType,
    inventoryMaxItems
  } = useRules();

  const [inventory] = useInventory();
  const isItemCraftable = useIsItemCraftable();

  const inventoryMaxQuantity = inventoryMaxItems - inventory.size();
  const isCrafting = type === "craft";
  const isEditing = type === "edit";
  const isSharing = type === "share";
  const isCreating = isCrafting || isSharing;

  const isDefaultNameTag = nameTag === "";
  const isDefaultPatches = Object.keys(patches).length === 0;
  const isDefaultSeed = seed === CS2_MIN_SEED;
  const isDefaultStatTrak = statTrak === false;
  const isDefaultStickers = Object.keys(stickers).length === 0;
  const isDefaultWear = wear === item.getMinimumWear();

  const allowStickers =
    (isCreating ? craftAllowStickers : editAllowStickers) &&
    (isCreating
      ? !craftHideType.includes(CS2ItemType.Sticker)
      : !editHideType.includes(CS2ItemType.Sticker));
  const allowPatches =
    (isCreating ? craftAllowPatches : editAllowPatches) &&
    (isCreating
      ? !craftHideType.includes(CS2ItemType.Patch)
      : !editHideType.includes(CS2ItemType.Patch));
  const allowStatTrak = isCreating ? craftAllowStatTrak : editAllowStatTrak;
  const allowSeed = isCreating ? craftAllowSeed : editAllowSeed;
  const allowWear = isCreating ? craftAllowWear : editAllowWear;
  const allowNameTag = isCreating ? craftAllowNametag : editAllowNametag;

  const canAddStickers = allowStickers || (isSharing && isDefaultStickers);
  const canAddPatches = allowPatches || (isSharing && isDefaultPatches);
  const canAddStatTrak = allowStatTrak || (isSharing && isDefaultStatTrak);
  const canAddSeed = allowSeed || (isSharing && isDefaultSeed);
  const canAddWear = allowWear || (isSharing && isDefaultWear);
  const canAddNameTag = allowNameTag || (isSharing && isDefaultNameTag);

  const itemHasStickers = item.hasStickers();
  const itemHasPatches = item.hasPatches();
  const itemHasStatTrak = item.hasStatTrak();
  const itemHasSeed = item.hasSeed();
  const itemHasWear = item.hasWear();
  const itemHasNameTag = item.hasNametag();

  const showStickers = itemHasStickers && (isSharing || allowStickers);
  const showPatches = itemHasPatches && (isSharing || allowPatches);
  const showStatTrak = itemHasStatTrak && (isSharing || allowStatTrak);
  const showSeed = itemHasSeed && (isSharing || allowSeed);
  const showWear = itemHasWear && (isSharing || allowWear);
  const showNameTag = itemHasNameTag && (isSharing || allowNameTag);

  const hasStickers = itemHasStickers && allowStickers;
  const hasPatches = itemHasPatches && allowPatches;
  const hasStatTrak = itemHasStatTrak && allowStatTrak;
  const hasSeed = itemHasSeed && allowSeed;
  const hasWear = itemHasWear && allowWear;
  const hasNameTag = itemHasNameTag && allowNameTag;

  const isWearValid =
    !itemHasWear ||
    ((!showWear || canAddWear) && CS2Economy.safeValidateWear(wear));
  const isNametagValid =
    !itemHasNameTag ||
    ((!showNameTag || canAddNameTag) &&
      (CS2Economy.safeValidateNametag(nameTag) || nameTag.length === 0));
  const isSeedValid =
    !itemHasSeed ||
    ((!showSeed || canAddSeed) && CS2Economy.safeValidateSeed(seed, item));
  const isStickersValid = !itemHasStickers || !showStickers || canAddStickers;
  const isPatchesValid = !itemHasPatches || !showPatches || canAddPatches;
  const isStatTrakValid = !itemHasStatTrak || !showStatTrak || canAddStatTrak;

  const hasQuantity = isItemCountable(item);

  const craftable =
    !inventory.isFull() &&
    isItemCraftable(item) &&
    isWearValid &&
    isNametagValid &&
    isSeedValid &&
    isStickersValid &&
    isPatchesValid &&
    isStatTrakValid;

  return {
    craftable,
    hasNameTag,
    hasPatches,
    hasQuantity,
    hasSeed,
    hasStatTrak,
    hasStickers,
    hasWear,
    inventoryMaxQuantity,
    isCrafting,
    isEditing,
    isNametagValid,
    isSeedValid,
    isSharing,
    isWearValid,
    showNameTag,
    showPatches,
    showSeed,
    showStatTrak,
    showStickers,
    showWear
  };
}
