/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FloatingFocusManager } from "@floating-ui/react";
import {
  CS2Team,
  CS2TeamValues,
  CS2_INVENTORY_EQUIPPABLE_ITEMS
} from "@ianlucas/cs2-lib";
import { CS_generateInspectLink } from "@ianlucas/cs2-lib-inspect";
import clsx from "clsx";
import { useInventoryItemFloating } from "~/components/hooks/use-inventory-item-floating";
import {
  EDITABLE_ITEM_TYPE,
  INSPECTABLE_IN_GAME_ITEM_TYPE,
  INSPECTABLE_ITEM_TYPE,
  UNLOCKABLE_ITEM_TYPE
} from "~/utils/inventory";
import { TransformedInventoryItem } from "~/utils/inventory-transform";
import { format } from "~/utils/number";
import { useInventory, useRules, useTranslate } from "./app-context";
import { InventoryItemContextMenu } from "./inventory-item-context-menu";
import { InventoryItemHover } from "./inventory-item-hover";
import { InventoryItemTile } from "./inventory-item-tile";
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
  onEquip?: (uid: number, team?: CS2TeamValues) => void;
  onInspectItem?: (uid: number) => void;
  onInspectStorageUnit?: (uid: number) => void;
  onRemove?: (uid: number) => void;
  onRename?: (uid: number) => void;
  onRenameStorageUnit?: (uid: number) => void;
  onRetrieveFromStorageUnit?: (uid: number) => void;
  onScrapeSticker?: (uid: number) => void;
  onSwapItemsStatTrak?: (uid: number) => void;
  onUnequip?: (uid: number, team?: CS2TeamValues) => void;
  onUnlockContainer?: (uid: number) => void;
  ownApplicableStickers?: boolean;
}) {
  const translate = useTranslate();
  const {
    editHideCategory,
    editHideId,
    editHideModel,
    editHideType,
    inventoryItemAllowApplySticker,
    inventoryItemAllowEdit,
    inventoryItemAllowInspectInGame,
    inventoryItemAllowScrapeSticker,
    inventoryItemAllowUnlockContainer,
    inventoryItemEquipHideModel,
    inventoryItemEquipHideType,
    inventoryStorageUnitMaxItems
  } = useRules();
  const [inventory] = useInventory();

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
  const data = item;

  const isEquippable =
    (item.model === undefined ||
      !inventoryItemEquipHideModel.includes(item.model)) &&
    !inventoryItemEquipHideType.includes(item.type);
  const canEquip =
    isEquippable &&
    data.teams === undefined &&
    !item.equipped &&
    CS2_INVENTORY_EQUIPPABLE_ITEMS.includes(data.type);
  const canEquipT =
    isEquippable && data.teams?.includes(CS2Team.T) && !item.equippedT;
  const canEquipCT =
    isEquippable && data.teams?.includes(CS2Team.CT) && !item.equippedCT;
  const canUnequip = isEquippable && item.equipped === true;
  const canUnequipT = isEquippable && item.equippedT === true;
  const canUnequipCT = isEquippable && item.equippedCT === true;

  const canSwapStatTrak = data.isStatTrakSwapTool();
  const canRename = data.isNameTag();
  const canApplySticker =
    inventoryItemAllowApplySticker &&
    ownApplicableStickers &&
    ((data.hasStickers() && Object.keys(item.stickers ?? {}).length < 4) ||
      data.isSticker());
  const canScrapeSticker =
    inventoryItemAllowScrapeSticker &&
    data.hasStickers() &&
    Object.keys(item.stickers ?? {}).length > 0;
  const canUnlockContainer =
    inventoryItemAllowUnlockContainer &&
    UNLOCKABLE_ITEM_TYPE.includes(data.type);
  const hasNametag = item.nameTag !== undefined;
  const isStorageUnit = data.isStorageUnit();
  const isEditable = EDITABLE_ITEM_TYPE.includes(data.type);
  const canInspect = INSPECTABLE_ITEM_TYPE.includes(data.type);
  const canInspectInGame =
    inventoryItemAllowInspectInGame &&
    (INSPECTABLE_IN_GAME_ITEM_TYPE.includes(data.type) || data.isNameTag());
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
                  },
                  {
                    condition: canInspectInGame,
                    label: translate("InventoryItemInspectInGame"),
                    onClick: close(() => {
                      window.location.assign(CS_generateInspectLink(item));
                    })
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
                    onClick: close(() => onEquip?.(uid, CS2Team.T))
                  },
                  {
                    condition: canEquipCT,
                    label: translate("InventoryItemEquipCT"),
                    onClick: close(() => onEquip?.(uid, CS2Team.CT))
                  },
                  {
                    condition: canEquipCT && canEquipT,
                    label: translate("InventoryItemEquipBothTeams"),
                    onClick: close(() => {
                      onEquip?.(uid, CS2Team.CT);
                      onEquip?.(uid, CS2Team.T);
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
                    onClick: close(() => onUnequip?.(uid, CS2Team.T))
                  },
                  {
                    condition: canUnequipCT,
                    label: translate("InventoryItemUnequipCT"),
                    onClick: close(() => onUnequip?.(uid, CS2Team.CT))
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
          <InventoryItemHover
            forwardRef={hoverRefs.setFloating}
            style={hoverStyles}
            {...getHoverFloatingProps()}
            item={item}
          />
        </FloatingFocusManager>
      )}
    </>
  );
}
