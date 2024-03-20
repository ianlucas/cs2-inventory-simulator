/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FloatingFocusManager } from "@floating-ui/react";
import {
  CS_INVENTORY_EQUIPPABLE_ITEMS,
  CS_NONE,
  CS_TEAM_CT,
  CS_TEAM_T,
  CS_Team,
  CS_hasSeed,
  CS_hasStickers,
  CS_hasWear,
  CS_isNametagTool,
  CS_isStatTrakSwapTool,
  CS_isStorageUnitTool
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
  item,
  model,
  name,
  onApplySticker,
  onClick,
  onDepositToStorageUnit,
  onEdit,
  onEquip,
  onInspectStorageUnit,
  onRemove,
  onRename,
  onRenameStorageUnit,
  onRetrieveFromStorageUnit,
  onScrapeSticker,
  onSwapItemsStatTrak,
  onUnequip,
  onUnlockContainer,
  ownApplicableStickers,
  uid
}: ReturnType<typeof transform> & {
  disableContextMenu?: boolean;
  disableHover?: boolean;
  onApplySticker?: (uid: number) => void;
  onClick?: (uid: number) => void;
  onDepositToStorageUnit?: (uid: number) => void;
  onEdit?: (uid: number) => void;
  onEquip?: (uid: number, team?: CS_Team) => void;
  onInspectStorageUnit?: (uid: number) => void;
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
  const { inventory, rules } = useRootContext();
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

  const isFreeInventoryItem = uid < 0;
  const { data } = item;

  const canEquip =
    data.teams === undefined &&
    !item.equipped &&
    CS_INVENTORY_EQUIPPABLE_ITEMS.includes(data.type);
  const canEquipT = data.teams?.includes(CS_TEAM_T) && !item.equippedT;
  const canEquipCT = data.teams?.includes(CS_TEAM_CT) && !item.equippedCT;
  const canUnequip = item.equipped === true;
  const canUnequipT = item.equippedT === true;
  const canUnequipCT = item.equippedCT === true;

  const hasStatTrak = item.stattrak !== undefined;
  const hasWear = !data.free && CS_hasWear(data);
  const hasSeed = !data.free && CS_hasSeed(data);
  const hasAttributes = hasWear || hasSeed;
  const canSwapStatTrak = CS_isStatTrakSwapTool(data);
  const canRename = CS_isNametagTool(data);
  const canApplySticker =
    ownApplicableStickers &&
    ((CS_hasStickers(data) &&
      (item.stickers ?? []).filter((id) => id !== CS_NONE).length < 4) ||
      data.type === "sticker");
  const canScrapeSticker =
    CS_hasStickers(data) &&
    (item.stickers ?? []).filter((id) => id !== CS_NONE).length > 0;
  const canUnlockContainer = ["case", "key"].includes(data.type);
  const hasContents = data.contents !== undefined;
  const hasTeams = data.teams !== undefined;
  const hasNametag = item.nametag !== undefined;
  const isStorageUnit = CS_isStorageUnitTool(data);
  const isEditable = EDITABLE_INVENTORY_TYPE.includes(data.type);

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
          item={data}
          equipped={equipped}
          nametag={item.nametag}
          onClick={
            onClick !== undefined ? close(() => onClick(uid)) : undefined
          }
          stattrak={item.stattrak}
          stickers={item.stickers}
          wear={item.wear}
        />
      </div>
      {!isFreeInventoryItem && !disableContextMenu && isClickOpen && (
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
                      isStorageUnit && inventory.isStorageUnitFilled(uid),
                    label: translate("InventoryItemStorageUnitInspect"),
                    onClick: close(() => onInspectStorageUnit?.(uid))
                  }
                ],
                [
                  {
                    condition:
                      isStorageUnit &&
                      inventory.canRetrieveFromStorageUnit(uid),
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
                    condition: rules.inventoryItemAllowEdit && isEditable,
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
      {!isFreeInventoryItem && !disableHover && isHoverOpen && !isClickOpen && (
        <FloatingFocusManager context={hoverContext} modal={false}>
          <div
            className="z-20 max-w-[320px] rounded bg-neutral-900/95 px-6 py-4 text-sm text-white outline-none"
            ref={hoverRefs.setFloating}
            style={hoverStyles}
            {...getHoverFloatingProps()}
          >
            <InventoryItemName inventoryItem={item} model={model} name={name} />
            {hasTeams && <InventoryItemTeams item={item.data} />}
            {hasStatTrak && <InventoryItemStatTrak inventoryItem={item} />}
            {hasContents && <InventoryItemContents item={item.data} />}
            {hasAttributes && (
              <div className="mt-2 flex flex-col gap-2">
                {hasWear && <InventoryItemWear inventoryItem={item} />}
                {hasSeed && <InventoryItemSeed inventoryItem={item} />}
              </div>
            )}
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
}
