/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import {
  isGraffitiBox,
  isSouvenirCase,
  isStickerCapsule,
  isWeaponCase
} from "~/utils/economy";
import { transform } from "~/utils/inventory";
import {
  INVENTORY_PRIMARY_FILTERS,
  INVENTORY_SECONDARY_FILTERS
} from "~/utils/inventory-filters";
import { useWatch } from "./use-watch";

export function useInventoryFiltersScrollTopHandler<T>(dependency: T) {
  useWatch((oldState, newState) => {
    if (oldState !== newState) {
      window.scrollTo({ top: 0 });
    }
  }, dependency);
}

export function useInventoryFilters() {
  const [primary, setPrimary] = useState(0);
  const [secondaries, setSecondaries] = useState(
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

  function filterItems({ item }: ReturnType<typeof transform>) {
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
            return ["pin", "musickit"].includes(item.data.type);
          case "Medals":
            return item.data.type === "pin";
          case "MusicKits":
            return item.data.type === "musickit";
        }
        break;
    }
    return false;
  }

  return {
    filterItems,
    handleClickPrimary,
    handleClickSecondary,
    primary,
    secondaries
  };
}
