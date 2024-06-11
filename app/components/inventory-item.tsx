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
import { generateInspectLink } from "@ianlucas/cs2-lib-inspect";
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
import { useInventory, useLocalize, useRules } from "./app-context";
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
  const localize = useLocalize();
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

  const isEquippable =
    (item.model === undefined ||
      !inventoryItemEquipHideModel.includes(item.model)) &&
    !inventoryItemEquipHideType.includes(item.type);
  const canEquip =
    isEquippable &&
    item.teams === undefined &&
    !item.equipped &&
    CS2_INVENTORY_EQUIPPABLE_ITEMS.includes(item.type);
  const canEquipT =
    isEquippable && item.teams?.includes(CS2Team.T) && !item.equippedT;
  const canEquipCT =
    isEquippable && item.teams?.includes(CS2Team.CT) && !item.equippedCT;
  const canUnequip = isEquippable && item.equipped === true;
  const canUnequipT = isEquippable && item.equippedT === true;
  const canUnequipCT = isEquippable && item.equippedCT === true;

  const canSwapStatTrak = item.isStatTrakSwapTool();
  const canRename = item.isNameTag();
  const canApplySticker =
    inventoryItemAllowApplySticker &&
    ownApplicableStickers &&
    ((item.hasStickers() && item.getStickersCount() < 4) || item.isSticker());
  const canScrapeSticker =
    inventoryItemAllowScrapeSticker &&
    item.hasStickers() &&
    item.getStickersCount() > 0;
  const canUnlockContainer =
    inventoryItemAllowUnlockContainer &&
    UNLOCKABLE_ITEM_TYPE.includes(item.type);
  const hasNametag = item.nameTag !== undefined;
  const isStorageUnit = item.isStorageUnit();
  const isEditable = EDITABLE_ITEM_TYPE.includes(item.type);
  const canInspect = INSPECTABLE_ITEM_TYPE.includes(item.type);
  const canInspectInGame =
    inventoryItemAllowInspectInGame &&
    (INSPECTABLE_IN_GAME_ITEM_TYPE.includes(item.type) || item.isNameTag());
  const canEdit =
    inventoryItemAllowEdit &&
    isEditable &&
    (item.category === undefined ||
      !editHideCategory.includes(item.category)) &&
    (item.type === undefined || !editHideType.includes(item.type)) &&
    (item.model === undefined || !editHideModel.includes(item.model)) &&
    !editHideId.includes(item.id);

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
                    label: localize("InventoryItemInspect"),
                    onClick: close(() => onInspectItem?.(uid))
                  },
                  {
                    condition: canInspectInGame,
                    label: localize("InventoryItemInspectInGame"),
                    onClick: close(() => {
                      window.location.assign(generateInspectLink(item));
                    })
                  }
                ],
                [
                  {
                    condition: canEquip,
                    label: localize("InventoryItemEquip"),
                    onClick: close(() => onEquip?.(uid))
                  },
                  {
                    condition: canEquipT,
                    label: localize("InventoryItemEquipT"),
                    onClick: close(() => onEquip?.(uid, CS2Team.T))
                  },
                  {
                    condition: canEquipCT,
                    label: localize("InventoryItemEquipCT"),
                    onClick: close(() => onEquip?.(uid, CS2Team.CT))
                  },
                  {
                    condition: canEquipCT && canEquipT,
                    label: localize("InventoryItemEquipBothTeams"),
                    onClick: close(() => {
                      onEquip?.(uid, CS2Team.CT);
                      onEquip?.(uid, CS2Team.T);
                    })
                  }
                ],
                [
                  {
                    condition: canUnequip,
                    label: localize("InventoryItemUnequip"),
                    onClick: close(() => onUnequip?.(uid))
                  },
                  {
                    condition: canUnequipT,
                    label: localize("InventoryItemUnequipT"),
                    onClick: close(() => onUnequip?.(uid, CS2Team.T))
                  },
                  {
                    condition: canUnequipCT,
                    label: localize("InventoryItemUnequipCT"),
                    onClick: close(() => onUnequip?.(uid, CS2Team.CT))
                  }
                ],
                [
                  {
                    condition: canUnlockContainer,
                    label: localize("InventoryItemUnlockContainer"),
                    onClick: close(() => onUnlockContainer?.(uid))
                  }
                ],
                [
                  {
                    condition: canRename,
                    label: localize("InventoryItemRename"),
                    onClick: close(() => onRename?.(uid))
                  },
                  {
                    condition: canSwapStatTrak,
                    label: localize("InventoryItemSwapStatTrak"),
                    onClick: close(() => onSwapItemsStatTrak?.(uid))
                  },
                  {
                    condition: canApplySticker,
                    label: localize("InventoryApplySticker"),
                    onClick: close(() => onApplySticker?.(uid))
                  },
                  {
                    condition: canScrapeSticker,
                    label: localize("InventoryScrapeSticker"),
                    onClick: close(() => onScrapeSticker?.(uid))
                  }
                ],
                [
                  {
                    condition:
                      isStorageUnit &&
                      (inventory.canDepositToStorageUnit(uid) ||
                        inventory.canRetrieveFromStorageUnit(uid)),
                    label: localize("InventoryItemStorageUnitInspect"),
                    onClick: close(() => {
                      if (inventory.getStorageUnitSize(uid) === 0) {
                        return alert({
                          bodyText: localize(
                            "InventoryItemStorageUnitEmptyBody",
                            format(inventoryStorageUnitMaxItems)
                          ),
                          closeText: localize(
                            "InventoryItemStorageUnitEmptyClose"
                          ),
                          titleText: localize(
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
                    label: localize("InventoryItemStorageUnitRetrieve"),
                    onClick: close(() => onRetrieveFromStorageUnit?.(uid))
                  },
                  {
                    condition:
                      isStorageUnit && inventory.canDepositToStorageUnit(uid),
                    label: localize("InventoryItemStorageUnitDeposit"),
                    onClick: close(() => onDepositToStorageUnit?.(uid))
                  }
                ],
                [
                  {
                    condition: isStorageUnit,
                    label: hasNametag
                      ? localize("InventoryItemRenameStorageUnit")
                      : localize("InventoryItemUseStorageUnit"),
                    onClick: close(() => onRenameStorageUnit?.(uid))
                  }
                ],
                [
                  {
                    condition: canEdit,
                    label: localize("InventoryItemEdit"),
                    onClick: close(() => onEdit?.(uid))
                  },
                  {
                    condition: true,
                    label: localize("InventoryItemDelete"),
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
