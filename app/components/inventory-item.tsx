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
  CS_isNametagTool,
  CS_isStorageUnitTool,
  CS_NO_STICKER,
  CS_Team,
  CS_TEAM_CT,
  CS_TEAM_T,
  isStatTrakSwapTool
} from "@ianlucas/cslib";
import clsx from "clsx";
import { useInventoryItemFloating } from "~/hooks/use-inventory-item-floating";
import { useTranslation } from "~/hooks/use-translation";
import { EDITABLE_INVENTORY_TYPE, transform } from "~/utils/inventory";
import { CSItem } from "./cs-item";
import { InventoryItemContents } from "./inventory-item-contents";
import { InventoryItemContextMenu } from "./inventory-item-context-menu";
import { InventoryItemName } from "./inventory-item-name";
import { InventoryItemSeed } from "./inventory-item-seed";
import { InventoryItemStatTrak } from "./inventory-item-stattrak";
import { InventoryItemTeams } from "./inventory-item-teams";
import { InventoryItemWear } from "./inventory-item-wear";
import { useRootContext } from "./root-context";

export function InventoryItem({
  disableContextMenu,
  disableHover,
  equipped,
  uid,
  inventoryItem,
  item,
  model,
  name,
  onApplySticker,
  onClick,
  onDepositToStorageUnit,
  onEdit,
  onEquip,
  onRemove,
  onRename,
  onRenameStorageUnit,
  onRetrieveFromStorageUnit,
  onScrapeSticker,
  onSwapItemsStatTrak,
  onUnequip,
  onUnlockContainer,
  ownApplicableStickers
}: ReturnType<typeof transform> & {
  disableContextMenu?: boolean;
  disableHover?: boolean;
  onApplySticker?: (uid: number) => void;
  onClick?: (uid: number) => void;
  onDepositToStorageUnit?: (uid: number) => void;
  onEdit?: (uid: number) => void;
  onEquip?: (uid: number, team?: CS_Team) => void;
  onRemove?: (uid: number) => void;
  onRename?: (uid: number) => void;
  onRenameStorageUnit?: (uid: number) => void;
  onRetrieveFromStorageUnit?: (uid: number) => void;
  onScrapeSticker?: (uid: number) => void;
  onSwapItemsStatTrak?: (uid: number) => void;
  onUnequip?: (uid: number, team?: CS_Team) => void;
  onUnlockContainer?: (uid: number) => void;
  ownApplicableStickers?: boolean;
}) {
  const { inventory } = useRootContext();
  const stubInventoryItem = uid < 0;
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
    setIsClickOpen,
    setIsHoverOpen
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
  const canSwapStatTrak = isStatTrakSwapTool(item);
  const canRename = CS_isNametagTool(item);
  const canApplySticker =
    ownApplicableStickers &&
    ((CS_hasStickers(item) &&
      (inventoryItem.stickers ?? []).filter((id) => id !== CS_NO_STICKER)
        .length < 4) ||
      item.type === "sticker");
  const canScrapeSticker =
    CS_hasStickers(item) &&
    (inventoryItem.stickers ?? []).filter((id) => id !== CS_NO_STICKER).length >
      0;
  const canUnlockContainer = ["case", "key"].includes(item.type);
  const hasContents = item.contents !== undefined;
  const hasTeams = item.teams !== undefined;
  const hasNametag = inventoryItem.nametag !== undefined;
  const isStorageUnit = CS_isStorageUnitTool(item);
  const isEditable = EDITABLE_INVENTORY_TYPE.includes(item.type);

  function close(callBeforeClosing: () => void) {
    return function close() {
      callBeforeClosing();
      setIsClickOpen(false);
      setIsHoverOpen(false);
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
            onClick !== undefined ? close(() => onClick(uid)) : undefined
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
                    onClick: close(() => onEquip?.(uid))
                  },
                  {
                    condition: canEquipT,
                    label: translate("InventoryItemEquipT"),
                    onClick: close(() => onEquip?.(uid, CS_TEAM_T))
                  },
                  {
                    condition: canEquipCT,
                    label: translate("InventoryItemEquipCT"),
                    onClick: close(() => onEquip?.(uid, CS_TEAM_CT))
                  },
                  {
                    condition: canEquipCT && canEquipT,
                    label: translate("InventoryItemEquipBothTeams"),
                    onClick: close(() => {
                      onEquip?.(uid, CS_TEAM_CT);
                      onEquip?.(uid, CS_TEAM_T);
                    })
                  }
                ],
                [
                  {
                    condition: canUnequip,
                    label: translate("InventoryItemUnequip"),
                    onClick: close(() => onUnequip?.(uid))
                  },
                  {
                    condition: canUnequipT,
                    label: translate("InventoryItemUnequipT"),
                    onClick: close(() => onUnequip?.(uid, CS_TEAM_T))
                  },
                  {
                    condition: canUnequipCT,
                    label: translate("InventoryItemUnequipCT"),
                    onClick: close(() => onUnequip?.(uid, CS_TEAM_CT))
                  }
                ],
                [
                  {
                    condition: canUnlockContainer,
                    label: translate("InventoryItemUnlockContainer"),
                    onClick: close(() => onUnlockContainer?.(uid))
                  }
                ],
                [
                  {
                    condition: canRename,
                    label: translate("InventoryItemRename"),
                    onClick: close(() => onRename?.(uid))
                  },
                  {
                    condition: canSwapStatTrak,
                    label: translate("InventoryItemSwapStatTrak"),
                    onClick: close(() => onSwapItemsStatTrak?.(uid))
                  },
                  {
                    condition: canApplySticker,
                    label: translate("InventoryApplySticker"),
                    onClick: close(() => onApplySticker?.(uid))
                  },
                  {
                    condition: canScrapeSticker,
                    label: translate("InventoryScrapeSticker"),
                    onClick: close(() => onScrapeSticker?.(uid))
                  }
                ],
                [
                  {
                    condition:
                      isStorageUnit && inventory.hasItemsInStorageUnit(uid),
                    label: translate("InventoryItemStorageUnitRetrieve"),
                    onClick: close(() => onRetrieveFromStorageUnit?.(uid))
                  },
                  {
                    condition:
                      isStorageUnit && inventory.canDepositToStorageUnit(uid),
                    label: translate("InventoryItemStorageUnitDeposit"),
                    onClick: close(() => onDepositToStorageUnit?.(uid))
                  }
                ],
                [
                  {
                    condition: isStorageUnit,
                    label: hasNametag
                      ? translate("InventoryItemRenameStorageUnit")
                      : translate("InventoryItemUseStorageUnit"),
                    onClick: close(() => onRenameStorageUnit?.(uid))
                  }
                ],
                [
                  {
                    condition: isEditable,
                    label: translate("InventoryItemEdit"),
                    onClick: close(() => onEdit?.(uid))
                  },
                  {
                    condition: true,
                    label: translate("InventoryItemDelete"),
                    onClick: close(() => onRemove?.(uid))
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
