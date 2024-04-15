/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  isGraffitiBox,
  isSouvenirCase,
  isStickerCapsule,
  isWeaponCase
} from "~/utils/economy";
import {
  TransformedInventoryItem,
  TransformedInventoryItems,
  sortByCollection,
  sortByEquipped,
  sortByName,
  sortByNewest,
  sortByQuality,
  sortByType
} from "~/utils/inventory";
import {
  INVENTORY_PRIMARY_FILTERS,
  INVENTORY_SECONDARY_FILTERS,
  INVENTORY_SORTERS
} from "~/utils/inventory-filters";
import { useStorageInput } from "./use-storage-input";
import { useStorageState } from "./use-storage-state";
import { useWatch } from "./use-watch";

export function useInventoryFiltersScrollTopHandler<T>(dependency: T) {
  useWatch((oldState, newState) => {
    if (oldState !== newState) {
      window.scrollTo({ top: 0 });
    }
  }, dependency);
}

export function sortItemsByEquipped(
  inventory: TransformedInventoryItems,
  free: TransformedInventoryItems
) {
  return [
    ...inventory.sort(sortByName).sort(sortByType).sort(sortByEquipped),
    ...free.sort(sortByName).sort(sortByType).sort(sortByEquipped)
  ];
}

export function useInventoryFilters() {
  const [search, setSearch] = useStorageInput("inventoryFilterSearch", "");
  const [sorter, setSorter] = useStorageState(
    "inventoryFilterSorter",
    INVENTORY_SORTERS[0].value
  );
  const [primary, setPrimary] = useStorageState("inventoryFilterPrimary", 0);
  const [secondaries, setSecondaries] = useStorageState(
    "inventoryFilterSecondaries",
    INVENTORY_PRIMARY_FILTERS.map(() => 0)
  );

  useInventoryFiltersScrollTopHandler(primary);
  useInventoryFiltersScrollTopHandler(secondaries);

  const secondary = secondaries[primary];
  const primaryAsString = INVENTORY_PRIMARY_FILTERS[primary];
  const secondaryAsString =
    INVENTORY_SECONDARY_FILTERS[primaryAsString]?.[secondary];

  function handleClickPrimary(index: number) {
    return function handleClickPrimary() {
      setPrimary(index);
    };
  }

  function handleClickSecondary(secondaryIndex: number) {
    return function handleClickSecondary() {
      setSecondaries((current) =>
        current.map((value, index) =>
          index === primary ? secondaryIndex : value
        )
      );
    };
  }

  function filterItems({ item }: TransformedInventoryItem) {
    if (search.length > 0) {
      const searchLower = search.toLowerCase();
      const nameLower = item.data.name.toLowerCase();
      const nametagLower = item.nametag?.toLowerCase() ?? "";
      if (nameLower.includes(searchLower)) {
        return true;
      }
      if (item.nametag !== undefined && nametagLower.includes(searchLower)) {
        return true;
      }
      return false;
    }
    switch (primaryAsString) {
      case "Everything":
        return true;
      case "Equipment":
        switch (secondaryAsString) {
          case "AllEquipment":
            return ["weapon", "agent", "glove", "melee", "musickit"].includes(
              item.data.type
            );
          case "Melee":
            return item.data.type === "melee";
          case "Pistols":
            return item.data.category === "secondary";
          case "MidTier":
            return ["heavy", "smg"].includes(item.data.category!);
          case "Rifles":
            return ["rifle"].includes(item.data.category!);
          case "Misc":
            return ["c4", "equipment"].includes(item.data.category!);
          case "Agents":
            return item.data.type === "agent";
          case "Gloves":
            return item.data.type === "glove";
          case "MusicKits":
            return item.data.type === "musickit";
        }
        break;
      case "GraphicArt":
        switch (secondaryAsString) {
          case "AllGraphicArt":
            return ["patch", "sticker", "graffiti"].includes(item.data.type);
          case "Patches":
            return item.data.type === "patch";
          case "Stickers":
            return item.data.type === "sticker";
          case "Graffiti":
            return item.data.type === "graffiti";
        }
        break;
      case "Containers":
        switch (secondaryAsString) {
          case "All":
            return ["case", "tool"].includes(item.data.type);
          case "WeaponCases":
            return isWeaponCase(item.data);
          case "StickerCapsules":
            return isStickerCapsule(item.data);
          case "GraffitiBoxes":
            return isGraffitiBox(item.data);
          case "SouvenirCases":
            return isSouvenirCase(item.data);
          case "Tools":
            return item.data.type === "tool";
        }
        break;
      case "Display":
        switch (secondaryAsString) {
          case "All":
            return ["collectible", "musickit"].includes(item.data.type);
          case "Medals":
            return item.data.type === "collectible";
          case "MusicKits":
            return item.data.type === "musickit";
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
    handleClickPrimary,
    handleClickSecondary,
    primary,
    search,
    secondaries,
    setSearch,
    setSorter,
    sorter,
    sortItems
  };
}
