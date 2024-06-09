/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2ItemType, CS2ItemTypeValues } from "@ianlucas/cs2-lib";
import {
  INVENTORY_PRIMARY_FILTERS,
  INVENTORY_SECONDARY_FILTERS,
  INVENTORY_SORTERS
} from "~/utils/inventory-filters";
import {
  TransformedInventoryItem,
  TransformedInventoryItems,
  sortByCollection,
  sortByEquipped,
  sortByName,
  sortByNewest,
  sortByQuality,
  sortByType,
  sortItemsByEquipped
} from "~/utils/inventory-transform";
import { useStorageInput } from "./use-storage-input";
import { useStorageState } from "./use-storage-state";
import { useWatch } from "./use-watch";

const ALL_EQUIPMENT_ITEM_TYPES: CS2ItemTypeValues[] = [
  CS2ItemType.Weapon,
  CS2ItemType.Agent,
  CS2ItemType.Gloves,
  CS2ItemType.Melee,
  CS2ItemType.MusicKit
];

const ALL_GRAPHIC_ART_ITEM_TYPES: CS2ItemTypeValues[] = [
  CS2ItemType.Patch,
  CS2ItemType.Sticker,
  CS2ItemType.Graffiti
];

const ALL_CONTAINERS_ITEM_TYPES: CS2ItemTypeValues[] = [
  CS2ItemType.Container,
  CS2ItemType.Tool
];

const ALL_DISPLAY_ITEM_TYPES: CS2ItemTypeValues[] = [
  CS2ItemType.Collectible,
  CS2ItemType.MusicKit
];

export function useScrollToTopOnChange<T>(dependency: T) {
  return useWatch((oldState, newState) => {
    if (oldState !== newState) {
      window.scrollTo({ top: 0 });
    }
  }, dependency);
}

export function useInventoryFilterState() {
  const [search, setSearch] = useStorageInput("inventoryFilterSearch", "");
  const [sorter, setSorter] = useStorageState(
    "inventoryFilterSorter",
    INVENTORY_SORTERS[0].value
  );
  const [primaryIndex, setPrimaryIndex] = useStorageState(
    "inventoryFilterPrimary",
    0
  );
  const [secondaryIndexes, setSecondaryIndexes] = useStorageState(
    "inventoryFilterSecondaries",
    INVENTORY_PRIMARY_FILTERS.map(() => 0)
  );

  useScrollToTopOnChange(primaryIndex);
  useScrollToTopOnChange(secondaryIndexes);

  const secondaryIndex = secondaryIndexes[primaryIndex];
  const primaryFilter = INVENTORY_PRIMARY_FILTERS[primaryIndex];
  const secondaryFilter =
    INVENTORY_SECONDARY_FILTERS[primaryFilter]?.[secondaryIndex];

  function handlePrimaryClick(index: number) {
    return function handlePrimaryClick() {
      setPrimaryIndex(index);
    };
  }

  function handleSecondaryClick(secondaryIndex: number) {
    return function handleSecondaryClick() {
      setSecondaryIndexes((current) =>
        current.map((value, index) =>
          index === primaryIndex ? secondaryIndex : value
        )
      );
    };
  }

  function filterItems({ item }: TransformedInventoryItem) {
    if (search.length > 0) {
      const searchLower = search.toLowerCase();
      const name = item.name.toLowerCase();
      const nametag = item.nameTag?.toLowerCase() ?? "";
      const altname = item.altName?.toLowerCase() ?? "";
      if (name.includes(searchLower)) {
        return true;
      }
      if (altname.includes(searchLower)) {
        return true;
      }
      if (nametag.includes(searchLower)) {
        return true;
      }
      return false;
    }
    switch (primaryFilter) {
      case "Everything":
        return true;
      case "Equipment":
        switch (secondaryFilter) {
          case "AllEquipment":
            return ALL_EQUIPMENT_ITEM_TYPES.includes(item.type);
          case "Melee":
            return item.type === CS2ItemType.Melee;
          case "Pistols":
            return item.category === "secondary";
          case "MidTier":
            return ["heavy", "smg"].includes(item.category!);
          case "Rifles":
            return ["rifle"].includes(item.category!);
          case "Misc":
            return ["c4", "equipment"].includes(item.category!);
          case "Agents":
            return item.isAgent();
          case "Gloves":
            return item.isGloves();
          case "MusicKits":
            return item.type === CS2ItemType.MusicKit;
        }
        break;
      case "GraphicArt":
        switch (secondaryFilter) {
          case "AllGraphicArt":
            return ALL_GRAPHIC_ART_ITEM_TYPES.includes(item.type);
          case "Patches":
            return item.type === CS2ItemType.Patch;
          case "Stickers":
            return item.type === CS2ItemType.Sticker;
          case "Graffiti":
            return item.type === CS2ItemType.Graffiti;
        }
        break;
      case "Containers":
        switch (secondaryFilter) {
          case "All":
            return ALL_CONTAINERS_ITEM_TYPES.includes(item.type);
          case "WeaponCases":
            return item.isWeaponCase();
          case "StickerCapsules":
            return item.isStickerCapsule();
          case "GraffitiBoxes":
            return item.isGraffitiBox();
          case "SouvenirCases":
            return item.isSouvenirCase();
          case "Tools":
            return item.type === CS2ItemType.Tool;
        }
        break;
      case "Display":
        switch (secondaryFilter) {
          case "All":
            return ALL_DISPLAY_ITEM_TYPES.includes(item.type);
          case "Medals":
            return item.type === CS2ItemType.Collectible;
          case "MusicKits":
            return item.type === CS2ItemType.MusicKit;
        }
        break;
    }
    return false;
  }

  function sortItems(
    inventory: TransformedInventoryItems,
    free: TransformedInventoryItems
  ) {
    switch (sorter) {
      case "equipped":
        return sortItemsByEquipped(inventory, free);
      case "newest":
        return [
          ...inventory.sort(sortByNewest),
          ...free.sort(sortByName).sort(sortByType).sort(sortByEquipped)
        ];
      case "quality":
        return [...inventory, ...free]
          .sort(sortByName)
          .sort(sortByType)
          .sort(sortByQuality);
      case "alphabetical":
        return [...inventory, ...free].sort(sortByName);
      case "type":
        return [...inventory, ...free].sort(sortByType);
      case "collection":
        return [...inventory.sort(sortByType).sort(sortByCollection), ...free];
    }
    return [];
  }

  return {
    filterItems,
    handlePrimaryClick,
    handleSecondaryClick,
    primaryIndex,
    search,
    secondaryIndexes,
    setSearch,
    setSorter,
    sorter,
    sortItems
  };
}
