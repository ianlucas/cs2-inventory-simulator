/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FloatingFocusManager } from "@floating-ui/react";
import {
  CS2_INVENTORY_EQUIPPABLE_ITEMS,
  CS2_MAX_PATCHES,
  CS2Team,
  CS2TeamValues
} from "@ianlucas/cs2-lib";
import {
  CS2_PREVIEW_INSPECTABLE_ITEMS,
  generateInspectLink,
  isCommandInspect
} from "@ianlucas/cs2-lib-inspect";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import clsx from "clsx";
import { useInventoryItemFloating } from "~/components/hooks/use-inventory-item-floating";
import {
  EDITABLE_ITEM_TYPE,
  getInventoryItemShareUrl,
  INSPECTABLE_ITEM_TYPE,
  UNLOCKABLE_ITEM_TYPE
} from "~/utils/inventory";
import { TransformedInventoryItem } from "~/utils/inventory-transform";
import { format } from "~/utils/number";
import { useInventory, useRules, useTranslate, useUser } from "./app-context";
import { InventoryItemContextMenu } from "./inventory-item-context-menu";
import { InventoryItemTile } from "./inventory-item-tile";
import { InventoryItemTooltip } from "./inventory-item-tooltip";
import { alert, confirm } from "./modal-generic";

export function InventoryItem({
  disableContextMenu,
  disableHover,
  equipped,
  item,
  onApplyPatch,
  onApplySticker,
  onClick,
  onDepositToStorageUnit,
  onEdit,
  onEquip,
  onInspectItem,
  onInspectStorageUnit,
  onRemove,
  onRemovePatch,
  onRename,
  onRenameStorageUnit,
  onRetrieveFromStorageUnit,
  onScrapeSticker,
  onSwapItemsStatTrak,
  onUnequip,
  onUnlockContainer,
  ownApplicablePatches,
  ownApplicableStickers,
  uid
}: TransformedInventoryItem & {
  disableContextMenu?: boolean;
  disableHover?: boolean;
  onApplyPatch?: (uid: number) => void;
  onApplySticker?: (uid: number) => void;
  onClick?: (uid: number) => void;
  onDepositToStorageUnit?: (uid: number) => void;
  onEdit?: (uid: number) => void;
  onEquip?: (uid: number, team?: CS2TeamValues) => void;
  onInspectItem?: (uid: number) => void;
  onInspectStorageUnit?: (uid: number) => void;
  onRemove?: (uid: number) => void;
  onRemovePatch?: (uid: number) => void;
  onRename?: (uid: number) => void;
  onRenameStorageUnit?: (uid: number) => void;
  onRetrieveFromStorageUnit?: (uid: number) => void;
  onScrapeSticker?: (uid: number) => void;
  onSwapItemsStatTrak?: (uid: number) => void;
  onUnequip?: (uid: number, team?: CS2TeamValues) => void;
  onUnlockContainer?: (uid: number) => void;
  ownApplicablePatches?: boolean;
  ownApplicableStickers?: boolean;
}) {
  const [, copyToClipboard] = useCopyToClipboard();
  const translate = useTranslate();
  const {
    editHideCategory,
    editHideId,
    editHideModel,
    editHideType,
    inventoryItemAllowApplyPatch,
    inventoryItemAllowApplySticker,
    inventoryItemAllowEdit,
    inventoryItemAllowInspectInGame,
    inventoryItemAllowRemovePatch,
    inventoryItemAllowScrapeSticker,
    inventoryItemAllowShare,
    inventoryItemAllowUnlockContainer,
    inventoryItemEquipHideModel,
    inventoryItemEquipHideType,
    inventoryStorageUnitMaxItems
  } = useRules();
  const [inventory] = useInventory();
  const user = useUser();

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
  const canApplyPatch =
    inventoryItemAllowApplyPatch &&
    ownApplicablePatches &&
    ((item.hasPatches() && item.getPatchesCount() < CS2_MAX_PATCHES) ||
      item.isPatch());
  const canRemovePatch =
    inventoryItemAllowRemovePatch &&
    item.hasPatches() &&
    item.getPatchesCount() > 0;
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
    (CS2_PREVIEW_INSPECTABLE_ITEMS.includes(item.type) || item.isNameTag());
  const canEdit =
    inventoryItemAllowEdit &&
    isEditable &&
    (item.category === undefined ||
      !editHideCategory.includes(item.category)) &&
    (item.type === undefined || !editHideType.includes(item.type)) &&
    (item.model === undefined || !editHideModel.includes(item.model)) &&
    !editHideId.includes(item.id);
  const canShare = inventoryItemAllowShare && item.isPaintable();

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
            className="font-display z-20 w-[192px] rounded-sm bg-neutral-800 py-2 text-sm text-white outline-hidden"
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
                    onClick: ({ setClickLabel }) => {
                      const inspectLink = generateInspectLink(item);
                      const isCommand = isCommandInspect(inspectLink);
                      copyToClipboard(inspectLink);
                      if (!isCommand) {
                        window.location.assign(inspectLink);
                      }
                      return setClickLabel(
                        isCommand
                          ? translate("InventoryItemInspectCopied")
                          : translate("InventoryItemInspectURLCopied")
                      );
                    }
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
                    label: translate("InventoryItemScrapeSticker"),
                    onClick: close(() => onScrapeSticker?.(uid))
                  },
                  {
                    condition: canApplyPatch,
                    label: translate("InventoryApplyPatch"),
                    onClick: close(() => onApplyPatch?.(uid))
                  },
                  {
                    condition: canRemovePatch,
                    label: translate("InventoryItemRemovePatch"),
                    onClick: close(() => onRemovePatch?.(uid))
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
                    condition: canShare,
                    label: translate("InventoryItemShare"),
                    clickLabel: translate("InventoryItemShareCopied"),
                    onClick: () =>
                      copyToClipboard(getInventoryItemShareUrl(item, user?.id))
                  },
                  {
                    condition: true,
                    label: translate("InventoryItemDelete"),
                    onClick: close(async () => {
                      if (
                        await confirm({
                          titleText: item.name,
                          bodyText: translate("InventoryItemDeleteConfirmDesc"),
                          cancelText: translate("GenericCancel"),
                          confirmText: translate("InventoryItemDeleteConfirm")
                        })
                      ) {
                        onRemove?.(uid);
                      }
                    })
                  }
                ]
              ]}
            />
          </div>
        </FloatingFocusManager>
      )}
      {!isFreeInventoryItem && !disableHover && isHoverOpen && !isClickOpen && (
        <FloatingFocusManager context={hoverContext} modal={false}>
          <InventoryItemTooltip
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
