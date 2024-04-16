/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FloatingFocusManager } from "@floating-ui/react";
import {
  CS_Economy,
  CS_INVENTORY_EQUIPPABLE_ITEMS,
  CS_NONE,
  CS_TEAM_CT,
  CS_TEAM_T,
  CS_Team
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useInventoryItemFloating } from "~/hooks/use-inventory-item-floating";
import {
  EDITABLE_ITEM_TYPE,
  INSPECTABLE_ITEM_TYPE,
  UNLOCKABLE_ITEM_TYPE
} from "~/utils/inventory";
import { TransformedInventoryItem } from "~/utils/inventory-transform";
import { format } from "~/utils/number";
import { useAppContext, useTranslate } from "./app-context";
import { InventoryItemContents } from "./inventory-item-contents";
import { InventoryItemContextMenu } from "./inventory-item-context-menu";
import { InventoryItemName } from "./inventory-item-name";
import { InventoryItemSeed } from "./inventory-item-seed";
import { InventoryItemStatTrak } from "./inventory-item-stattrak";
import { InventoryItemTeams } from "./inventory-item-teams";
import { InventoryItemTile } from "./inventory-item-tile";
import { InventoryItemWear } from "./inventory-item-wear";
import { alert } from "./modal-generic";

export function InventoryItem({
  disableContextMenu,
  disableHover,
  equipped,
  item,
  onApplySticker,
  onClick,
  onDepositToStorageUnit,
  onEdit,
  onEquip,
  onInspectItem,
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
}: TransformedInventoryItem & {
  disableContextMenu?: boolean;
  disableHover?: boolean;
  onApplySticker?: (uid: number) => void;
  onClick?: (uid: number) => void;
  onDepositToStorageUnit?: (uid: number) => void;
  onEdit?: (uid: number) => void;
  onEquip?: (uid: number, team?: CS_Team) => void;
  onInspectItem?: (uid: number) => void;
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
  const {
    inventory,
    rules: {
      editHideCategory,
      editHideId,
      editHideModel,
      editHideType,
      inventoryItemAllowApplySticker,
      inventoryItemAllowEdit,
      inventoryItemAllowScrapeSticker,
      inventoryItemAllowUnlockContainer,
      inventoryItemEquipHideModel,
      inventoryItemEquipHideType,
      inventoryStorageUnitMaxItems
    },
    preferences: { statsForNerds }
  } = useAppContext();
  const translate = useTranslate();

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

  const isEquippable =
    (item.data.model === undefined ||
      !inventoryItemEquipHideModel.includes(item.data.model)) &&
    !inventoryItemEquipHideType.includes(item.data.type);
  const canEquip =
    isEquippable &&
    data.teams === undefined &&
    !item.equipped &&
    CS_INVENTORY_EQUIPPABLE_ITEMS.includes(data.type);
  const canEquipT =
    isEquippable && data.teams?.includes(CS_TEAM_T) && !item.equippedT;
  const canEquipCT =
    isEquippable && data.teams?.includes(CS_TEAM_CT) && !item.equippedCT;
  const canUnequip = isEquippable && item.equipped === true;
  const canUnequipT = isEquippable && item.equippedT === true;
  const canUnequipCT = isEquippable && item.equippedCT === true;

  const hasStatTrak = item.stattrak !== undefined;
  const hasWear = !data.free && CS_Economy.hasWear(data);
  const hasSeed = !data.free && CS_Economy.hasSeed(data);
  const hasAttributes = hasWear || hasSeed;
  const canSwapStatTrak = CS_Economy.isStatTrakSwapTool(data);
  const canRename = CS_Economy.isNametagTool(data);
  const canApplySticker =
    inventoryItemAllowApplySticker &&
    ownApplicableStickers &&
    ((CS_Economy.hasStickers(data) &&
      (item.stickers ?? []).filter((id) => id !== CS_NONE).length < 4) ||
      data.type === "sticker");
  const canScrapeSticker =
    inventoryItemAllowScrapeSticker &&
    CS_Economy.hasStickers(data) &&
    (item.stickers ?? []).filter((id) => id !== CS_NONE).length > 0;
  const canUnlockContainer =
    inventoryItemAllowUnlockContainer &&
    UNLOCKABLE_ITEM_TYPE.includes(data.type);
  const hasContents = data.contents !== undefined;
  const hasTeams = data.teams !== undefined;
  const hasNametag = item.nametag !== undefined;
  const isStorageUnit = CS_Economy.isStorageUnitTool(data);
  const isEditable = EDITABLE_ITEM_TYPE.includes(data.type);
  const canInspect = INSPECTABLE_ITEM_TYPE.includes(data.type);
  const canEdit =
    inventoryItemAllowEdit &&
    isEditable &&
    (data.category === undefined ||
      !editHideCategory.includes(data.category)) &&
    (data.type === undefined || !editHideType.includes(data.type)) &&
    (data.model === undefined || !editHideModel.includes(data.model)) &&
    !editHideId.includes(data.id);

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
        <InventoryItemTile
          equipped={equipped}
          item={item}
          onClick={
            onClick !== undefined ? close(() => onClick(uid)) : undefined
          }
        />
      </div>
      {!isFreeInventoryItem && !disableContextMenu && isClickOpen && (
        <FloatingFocusManager context={clickContext} modal={false}>
          <div
            className="z-20 w-[192px] rounded bg-neutral-800 py-2 text-sm text-white outline-none"
            ref={clickRefs.setFloating}
            style={clickStyles}
            {...getClickFloatingProps()}
          >
            <InventoryItemContextMenu
              menu={[
                [
                  {
                    condition: canInspect,
                    label: translate("InventoryItemInspect"),
                    onClick: close(() => onInspectItem?.(uid))
                  }
                ],
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
                      isStorageUnit &&
                      (inventory.canDepositToStorageUnit(uid) ||
                        inventory.canRetrieveFromStorageUnit(uid)),
                    label: translate("InventoryItemStorageUnitInspect"),
                    onClick: close(() => {
                      if (inventory.getStorageUnitSize(uid) === 0) {
                        return alert({
                          bodyText: translate(
                            "InventoryItemStorageUnitEmptyBody",
                            format(inventoryStorageUnitMaxItems)
                          ),
                          closeText: translate(
                            "InventoryItemStorageUnitEmptyClose"
                          ),
                          titleText: translate(
                            "InventoryItemStorageUnitEmptyTitle"
                          )
                        });
                      }

                      onInspectStorageUnit?.(uid);
                    })
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
                    condition: canEdit,
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
            className="z-20 w-[440px] rounded bg-neutral-900/95 px-6 py-4 text-sm text-white outline-none"
            ref={hoverRefs.setFloating}
            style={hoverStyles}
            {...getHoverFloatingProps()}
          >
            <InventoryItemName inventoryItem={item} />
            {hasTeams && <InventoryItemTeams item={item.data} />}
            {hasStatTrak && <InventoryItemStatTrak inventoryItem={item} />}
            {hasContents && <InventoryItemContents item={item.data} />}
            {statsForNerds && hasAttributes && (
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
