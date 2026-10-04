/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory, CS2InventoryData } from "@ianlucas/cs2-lib";
import { useMemo } from "react";
import { useInspectItem } from "~/components/hooks/use-inspect-item";
import { sortItemsByEquipped, transform } from "~/shared/inventory-transform";
import { useInventory, useTranslate } from "./app-context";
import { InfoIcon } from "./info-icon";
import { InspectItem } from "./inspect-item";
import { InventoryGridPlaceholder } from "./inventory-grid-placeholder";
import { InventoryItem } from "./inventory-item";
import { Presence } from "./presence";

export function ProfileInventory({
  inventory: data,
  ownerId,
  rules
}: {
  inventory: CS2InventoryData | null;
  ownerId: string;
  rules: {
    inventoryItemEquipHideModel: string[];
    inventoryItemEquipHideType: string[];
    inventoryMaxItems: number;
    inventoryStorageUnitMaxItems: number;
  };
}) {
  const translate = useTranslate();
  // AppProvider replaces the user's inventory after loading item translations,
  // so rebuilding along with it keeps item names in the current language.
  const [userInventory] = useInventory();

  const items = useMemo(
    () =>
      sortItemsByEquipped(
        new CS2Inventory({
          data: data ?? undefined,
          maxItems: rules.inventoryMaxItems,
          storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
        })
          .getAll()
          .map((item) =>
            transform(item, {
              models: rules.inventoryItemEquipHideModel,
              types: rules.inventoryItemEquipHideType
            })
          ),
        []
      ),
    [data, rules, userInventory]
  );

  const { closeInspectItem, handleInspectItem, inspectItem } = useInspectItem();
  const inspectedItem = items.find(({ uid }) => uid === inspectItem?.uid)?.item;

  return (
    <>
      <div className="m-auto grid w-full grid-cols-[repeat(auto-fit,minmax(154px,1fr))] px-2 select-none [grid-gap:1em] lg:my-8 lg:w-5xl lg:px-0">
        {items.map((item) => (
          <div key={item.uid} className="flex items-start justify-center">
            <InventoryItem
              {...item}
              inspectOnly
              onInspectItem={handleInspectItem}
            />
          </div>
        ))}
        <InventoryGridPlaceholder />
      </div>
      {items.length === 0 && (
        <div className="m-auto flex justify-center select-none lg:w-5xl">
          <div className="flex w-full items-center justify-center gap-2 bg-linear-to-r from-transparent via-black/30 to-transparent py-1">
            <InfoIcon className="h-4" />
            {translate("InventoryNoItemsToDisplay")}
          </div>
        </div>
      )}
      <Presence present={inspectedItem !== undefined}>
        {inspectedItem !== undefined ? (
          <InspectItem
            item={inspectedItem}
            onClose={closeInspectItem}
            ownerId={ownerId}
          />
        ) : null}
      </Presence>
    </>
  );
}
