/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FloatingFocusManager } from "@floating-ui/react";
import {
  CS_hasSeed,
  CS_hasStickers,
  CS_hasWear,
  CS_INVENTORY_EQUIPPABLE_ITEMS,
  CS_Item,
  CS_NAMETAG_TOOL_DEF,
  CS_Team,
  CS_TEAM_CT,
  CS_TEAM_T
} from "@ianlucas/cslib";
import clsx from "clsx";
import { useInventoryItemFloating } from "~/hooks/use-inventory-item-floating";
import { useTranslation } from "~/hooks/use-translation";
import { transform } from "~/utils/inventory";
import { CSItem } from "./cs-item";
import { InventoryItemContents } from "./inventory-item-contents";
import { InventoryItemContextMenu } from "./inventory-item-context-menu";
import { InventoryItemName } from "./inventory-item-name";
import { InventoryItemSeed } from "./inventory-item-seed";
import { InventoryItemTeams } from "./inventory-item-teams";
import { InventoryItemWear } from "./inventory-item-wear";
import { InventoryItemStatTrak } from "./inventory-item-stattrak";

export function InventoryItem({
  disableContextMenu,
  disableHover,
  equipped,
  index,
  inventoryItem,
  item,
  model,
  name,
  onApplySticker,
  onClick,
  onEquip,
  onRemove,
  onRename,
  onScrapeSticker,
  onUnequip,
  onUnlockContainer,
  ownApplicableStickers
}: ReturnType<typeof transform> & {
  disableContextMenu?: boolean;
  disableHover?: boolean;
  onApplySticker?(index: number, item: CS_Item): void;
  onClick?(index: number, item: CS_Item): void;
  onEquip?(index: number, team?: CS_Team): void;
  onRemove?(index: number): void;
  onRename?(index: number, item: CS_Item): void;
  onScrapeSticker?(index: number, item: CS_Item): void;
  onUnequip?(index: number, team?: CS_Team): void;
  onUnlockContainer?(index: number, item: CS_Item): void;
  ownApplicableStickers?: boolean;
}) {
  const stubInventoryItem = index < 0;
  const translate = useTranslation();
  const {
    clickContext,
    clickRefs,
    clickStyles,
    getClickFloatingProps,
    getClickReferenceProps,
    getHoverFloatingProps,
    getHoverReferenceProps,
    hoverContext,
    hoverRefs,
    hoverStyles,
    isClickOpen,
    isHoverOpen,
    ref,
    setIsClickOpen
  } = useInventoryItemFloating();

  const canEquip =
    item.teams === undefined &&
    !inventoryItem.equipped &&
    CS_INVENTORY_EQUIPPABLE_ITEMS.includes(item.type);
  const canEquipT = item.teams?.includes(CS_TEAM_T) && !inventoryItem.equippedT;
  const canEquipCT =
    item.teams?.includes(CS_TEAM_CT) && !inventoryItem.equippedCT;
  const canUnequip = inventoryItem.equipped === true;
  const canUnequipT = inventoryItem.equippedT === true;
  const canUnequipCT = inventoryItem.equippedCT === true;

  const hasStatTrak = inventoryItem.stattrak !== undefined;
  const hasWear = !item.free && CS_hasWear(item);
  const hasSeed = !item.free && CS_hasSeed(item);
  const hasAttributes = hasWear || hasSeed;
  const canRename = item.type == "tool" && item.def === CS_NAMETAG_TOOL_DEF;
  const canApplySticker =
    ownApplicableStickers &&
    ((CS_hasStickers(item) &&
      (inventoryItem.stickers ?? []).filter((id) => id !== null).length < 4) ||
      item.type === "sticker");
  const canScrapeSticker =
    CS_hasStickers(item) &&
    (inventoryItem.stickers ?? []).filter((id) => id !== null).length > 0;
  const canUnlockContainer = ["case", "key"].includes(item.type);
  const hasContents = item.contents !== undefined;
  const hasTeams = item.teams !== undefined;

  function close(callBeforeClosing: () => void) {
    return function close() {
      callBeforeClosing();
      setIsClickOpen(false);
    };
  }

  return (
    <>
      <div
        className={clsx(
          "relative w-[154px] transition-all",
          onClick === undefined && "hover:drop-shadow-[0_0_5px_rgba(0,0,0,1)]"
        )}
        ref={ref}
        {...getHoverReferenceProps(getClickReferenceProps())}
      >
        <CSItem
          item={item}
          equipped={equipped}
          nametag={inventoryItem.nametag}
          onClick={
            onClick !== undefined ? () => onClick(index, item) : undefined
          }
          stattrak={inventoryItem.stattrak}
          stickers={inventoryItem.stickers}
          wear={inventoryItem.wear}
        />
      </div>
      {!stubInventoryItem && !disableContextMenu && isClickOpen && (
        <FloatingFocusManager context={clickContext} modal={false}>
          <div
            className="z-10 w-[192px] rounded bg-neutral-800 py-2 text-sm text-white outline-none"
            ref={clickRefs.setFloating}
            style={clickStyles}
            {...getClickFloatingProps()}
          >
            <InventoryItemContextMenu
              menu={[
                [
                  {
                    condition: canEquip,
                    label: translate("InventoryItemEquip"),
                    onClick: close(() => onEquip?.(index))
                  },
                  {
                    condition: canEquipT,
                    label: translate("InventoryItemEquipT"),
                    onClick: close(() => onEquip?.(index, CS_TEAM_T))
                  },
                  {
                    condition: canEquipCT,
                    label: translate("InventoryItemEquipCT"),
                    onClick: close(() => onEquip?.(index, CS_TEAM_CT))
                  },
                  {
                    condition: canEquipCT && canEquipT,
                    label: translate("InventoryItemEquipBothTeams"),
                    onClick: close(() => {
                      onEquip?.(index, CS_TEAM_CT);
                      onEquip?.(index, CS_TEAM_T);
                    })
                  }
                ],
                [
                  {
                    condition: canUnequip,
                    label: translate("InventoryItemUnequip"),
                    onClick: close(() => onUnequip?.(index))
                  },
                  {
                    condition: canUnequipT,
                    label: translate("InventoryItemUnequipT"),
                    onClick: close(() => onUnequip?.(index, CS_TEAM_T))
                  },
                  {
                    condition: canUnequipCT,
                    label: translate("InventoryItemUnequipCT"),
                    onClick: close(() => onUnequip?.(index, CS_TEAM_CT))
                  }
                ],
                [
                  {
                    condition: canUnlockContainer,
                    label: translate("InventoryItemUnlockContainer"),
                    onClick: () => onUnlockContainer?.(index, item)
                  }
                ],
                [
                  {
                    condition: canRename,
                    label: translate("InventoryItemRename"),
                    onClick: () => onRename?.(index, item)
                  },
                  {
                    condition: canApplySticker,
                    label: translate("InventoryApplySticker"),
                    onClick: () => onApplySticker?.(index, item)
                  },
                  {
                    condition: canScrapeSticker,
                    label: translate("InventoryScrapeSticker"),
                    onClick: () => onScrapeSticker?.(index, item)
                  }
                ],
                [
                  {
                    condition: true,
                    label: translate("InventoryItemDelete"),
                    onClick: close(() => onRemove?.(index))
                  }
                ]
              ]}
            />
          </div>
        </FloatingFocusManager>
      )}
      {!stubInventoryItem && !disableHover && isHoverOpen && !isClickOpen && (
        <FloatingFocusManager context={hoverContext} modal={false}>
          <div
            className="z-20 max-w-[320px] rounded bg-neutral-900/95 px-6 py-4 text-sm text-white outline-none"
            ref={hoverRefs.setFloating}
            style={hoverStyles}
            {...getHoverFloatingProps()}
          >
            <InventoryItemName
              inventoryItem={inventoryItem}
              model={model}
              name={name}
            />
            {hasTeams && <InventoryItemTeams item={item} />}
            {hasStatTrak && (
              <InventoryItemStatTrak inventoryItem={inventoryItem} />
            )}
            {hasContents && <InventoryItemContents item={item} />}
            {hasAttributes && (
              <div className="mt-2 flex flex-col gap-2">
                {hasWear && <InventoryItemWear inventoryItem={inventoryItem} />}
                {hasSeed && <InventoryItemSeed inventoryItem={inventoryItem} />}
              </div>
            )}
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
}
