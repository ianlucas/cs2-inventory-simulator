/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FloatingFocusManager } from "@floating-ui/react";
import {
  CS2_PREVIEW_INSPECTABLE_ITEMS,
  generateInspectLink,
  isCommandInspect
} from "@ianlucas/cs2-lib-inspect";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import clsx from "clsx";
import { ComponentProps } from "react";
import { useInventoryItemFloating } from "~/components/hooks/use-inventory-item-floating";
import { useEditItemFilter } from "~/components/hooks/use-item-hide-filters";
import { useLoadoutItemWarning } from "~/components/hooks/use-loadouts";
import { useViewerAvailability } from "~/components/hooks/use-viewer-availability";
import { getInventoryItemShareUrl } from "~/inventory.client";
import {
  EDITABLE_ITEM_TYPE,
  INSPECTABLE_ITEM_TYPE,
  UNLOCKABLE_ITEM_TYPE
} from "~/shared/inventory";
import { TransformedInventoryItem } from "~/shared/inventory-transform";
import type { LoadoutTeam } from "~/shared/loadout";
import { has } from "~/shared/misc";
import { format } from "~/shared/number";
import { SoundName } from "~/sound-events";
import {
  useEquippedInventory,
  useInventory,
  useRules,
  useTranslate,
  useUser
} from "./app-context";
import {
  InventoryItemContextButton,
  InventoryItemContextMenu
} from "./inventory-item-context-menu";
import { getEquipMenu } from "./inventory-item-equip-menu";
import { InventoryItemTile } from "./inventory-item-tile";
import { InventoryItemTooltip } from "./inventory-item-tooltip";
import { alert, confirm } from "./modal-generic";

export function InventoryItem({
  clickSound,
  disableContextMenu,
  disableHover,
  draggable,
  equipped,
  foreign,
  inspectOnly,
  item,
  onApplyPatch,
  onApplySticker,
  onAttachCharm,
  onClick,
  onDepositToStorageUnit,
  onDetachCharm,
  onDetachCharmWithTool,
  onEdit,
  onEquip,
  onExtractSticker,
  onInspectItem,
  onInspectStorageUnit,
  onRemove,
  onRemovePatch,
  onRename,
  onRenamePet,
  onRenameStorageUnit,
  onRetrieveFromStorageUnit,
  onScrapeSticker,
  onSealSticker,
  onSwapItemsStatTrak,
  onUnequip,
  onUnlockContainer,
  onUnsealGraffiti,
  onUseItem,
  onViewInLoadout,
  ownApplicableKeychains,
  ownApplicablePatches,
  ownApplicableStickers,
  rightClickContextMenu,
  selected,
  uid
}: TransformedInventoryItem & {
  clickSound?: SoundName;
  disableContextMenu?: boolean;
  disableHover?: boolean;
  draggable?: boolean;
  /** Not from the user's inventory, e.g. on someone's profile. */
  foreign?: boolean;
  /** Only offers the inspect actions. */
  inspectOnly?: boolean;
  onApplyPatch?: (uid: number) => void;
  onApplySticker?: (uid: number) => void;
  onAttachCharm?: (uid: number) => void;
  onClick?: (uid: number) => void;
  onDepositToStorageUnit?: (uid: number) => void;
  onDetachCharm?: (uid: number) => void;
  onDetachCharmWithTool?: (uid: number) => void;
  onEdit?: (uid: number) => void;
  onEquip?: (uid: number, team?: LoadoutTeam) => void;
  onExtractSticker?: (uid: number) => void;
  onInspectItem?: (uid: number) => void;
  onInspectStorageUnit?: (uid: number) => void;
  onRemove?: (uid: number) => void;
  onRemovePatch?: (uid: number) => void;
  onRename?: (uid: number) => void;
  onRenamePet?: (uid: number) => void;
  onRenameStorageUnit?: (uid: number) => void;
  onRetrieveFromStorageUnit?: (uid: number) => void;
  onScrapeSticker?: (uid: number) => void;
  onSealSticker?: (uid: number) => void;
  onSwapItemsStatTrak?: (uid: number) => void;
  onUnequip?: (uid: number, team?: LoadoutTeam) => void;
  onUnlockContainer?: (uid: number) => void;
  onUnsealGraffiti?: (uid: number) => void;
  onUseItem?: (uid: number) => void;
  onViewInLoadout?: (team?: LoadoutTeam) => void;
  ownApplicableKeychains?: boolean;
  ownApplicablePatches?: boolean;
  ownApplicableStickers?: boolean;
  /** Opens the context menu on right-click, leaving left-click to `onClick`. */
  rightClickContextMenu?: boolean;
  selected?: boolean;
}) {
  const [, copyToClipboard] = useCopyToClipboard();
  const translate = useTranslate();
  const getLoadoutItemWarning = useLoadoutItemWarning();
  const {
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
    inventoryItemMaxPatches,
    inventoryItemMaxStickers,
    inventoryStorageUnitMaxItems
  } = useRules();
  const [inventory] = useInventory();
  const equippedInventory = useEquippedInventory();
  const user = useUser();
  const isItemEditable = useEditItemFilter();
  const { canUse3d: canUse3dAttach } = useViewerAvailability(item, {
    attachment: true
  });

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
  } = useInventoryItemFloating({ rightClick: rightClickContextMenu });

  const isFreeInventoryItem = uid < 0;

  const isEquippable =
    (item.modelKey === undefined ||
      !inventoryItemEquipHideModel.includes(item.modelKey)) &&
    !inventoryItemEquipHideType.includes(item.type) &&
    !item.isSealed();

  const canSwapStatTrak = item.isStatTrakSwapTool();
  const canRename = item.isNameTag();
  const canApplyPatch =
    inventoryItemAllowApplyPatch &&
    ownApplicablePatches &&
    inventoryItemMaxPatches > 0 &&
    ((item.hasPatches() && item.getPatchesCount() < inventoryItemMaxPatches) ||
      item.isPatch());
  const canRemovePatch =
    inventoryItemAllowRemovePatch &&
    item.hasPatches() &&
    item.getPatchesCount() > 0;
  const canApplySticker =
    inventoryItemAllowApplySticker &&
    ownApplicableStickers &&
    inventoryItemMaxStickers > 0 &&
    ((item.hasStickers() &&
      item.getStickersCount() < inventoryItemMaxStickers) ||
      item.isSticker());
  const canAttachCharm =
    canUse3dAttach &&
    ownApplicableKeychains &&
    ((item.hasKeychains() && item.getKeychainsCount() === 0) ||
      item.isKeychain());
  const canDetachCharm = item.hasKeychains() && item.getKeychainsCount() > 0;
  const canScrapeSticker =
    inventoryItemAllowScrapeSticker &&
    item.hasStickers() &&
    item.getStickersCount() > 0;
  const canUnlockContainer =
    inventoryItemAllowUnlockContainer &&
    UNLOCKABLE_ITEM_TYPE.includes(item.type);
  const hasNametag = item.nameTag !== undefined;
  const isStorageUnit = item.isStorageUnit();
  const isNameablePet = item.isNameablePet();
  const isEditable = EDITABLE_ITEM_TYPE.includes(item.type);
  const canInspect =
    INSPECTABLE_ITEM_TYPE.includes(item.type) ||
    item.isChickenEgg() ||
    item.isChickenFeed();
  const canInspectInGame =
    inventoryItemAllowInspectInGame &&
    (CS2_PREVIEW_INSPECTABLE_ITEMS.includes(item.type) || item.isNameTag());
  const canEdit = inventoryItemAllowEdit && isEditable && isItemEditable(item);
  const canShare = inventoryItemAllowShare && item.isPaintable();
  const isUseItemOnly = item.isCharmDetachmentPack();
  const isCharmDetachments = item.isCharmDetachment();
  const isStickerSlab = item.isStickerSlab();
  const canSealSticker = item.isSticker() && item.hasDisplayCase();
  const canExtractSticker = item.isStickerDisplayCase();
  const canUnsealGraffiti = item.isGraffiti() && item.isSealed();

  function close(callBeforeClosing: () => void) {
    return function close() {
      callBeforeClosing();
      setIsClickOpen(false);
      setIsHoverOpen(false);
    };
  }

  function copyInspectLink(setClickLabel: (value: string) => void) {
    const inspectLink = generateInspectLink(item);
    copyToClipboard(inspectLink);
    setClickLabel(
      isCommandInspect(inspectLink)
        ? translate("InventoryItemInspectCopied")
        : translate("InventoryItemInspectURLCopied")
    );
    return inspectLink;
  }

  const inspectInGameMenu: ComponentProps<typeof InventoryItemContextButton>[] =
    [
      {
        condition: canInspectInGame,
        label: translate("InventoryItemInspectInGame"),
        onClick: ({ setClickLabel }) => {
          const inspectLink = copyInspectLink(setClickLabel);
          if (!isCommandInspect(inspectLink)) {
            window.location.assign(inspectLink);
          }
        }
      },
      {
        condition: canInspectInGame,
        label: translate("InventoryItemCopyInspectLink"),
        onClick: ({ setClickLabel }) => copyInspectLink(setClickLabel)
      }
    ];

  const inspectOnlyMenu = [
    {
      condition: canInspect || isCharmDetachments || isStickerSlab,
      label: translate("InventoryItemInspect"),
      onClick: close(() => onInspectItem?.(uid))
    },
    ...inspectInGameMenu
  ];

  const hasContextMenu =
    (!isFreeInventoryItem || isCharmDetachments) &&
    !disableContextMenu &&
    (!inspectOnly || inspectOnlyMenu.some(({ condition }) => condition));

  return (
    <>
      <div
        className={clsx(
          "relative w-38.5 transition-all",
          (onClick === undefined || draggable) &&
            "hover:drop-shadow-[0_0_5px_rgba(0,0,0,1)]",
          selected && "drop-shadow-[0_0_5px_rgba(0,0,0,1)]"
        )}
        ref={ref}
        {...getHoverReferenceProps(getClickReferenceProps())}
      >
        <InventoryItemTile
          clickSound={clickSound}
          draggable={draggable}
          equipped={equipped}
          foreign={foreign}
          item={item}
          preview
          selected={selected}
          onClick={
            onClick !== undefined ? close(() => onClick(uid)) : undefined
          }
        />
      </div>
      {hasContextMenu && isClickOpen && (
        <FloatingFocusManager context={clickContext} modal={false}>
          <div
            role="menu"
            className="font-display z-20 w-48 rounded-sm bg-neutral-800 py-2 text-sm text-white outline-hidden"
            ref={clickRefs.setFloating}
            style={clickStyles}
            {...getClickFloatingProps()}
          >
            <InventoryItemContextMenu
              menu={
                inspectOnly
                  ? [inspectOnlyMenu]
                  : isCharmDetachments
                    ? [
                        [
                          {
                            condition: true,
                            label: translate("InventoryItemInspect"),
                            onClick: close(() => onInspectItem?.(uid))
                          },
                          {
                            condition: true,
                            label: translate("InventoryItemDetachCharm"),
                            onClick: close(() => onDetachCharmWithTool?.(uid))
                          }
                        ]
                      ]
                    : isStickerSlab
                      ? [
                          [
                            {
                              condition: true,
                              label: translate("InventoryItemInspect"),
                              onClick: close(() => onInspectItem?.(uid))
                            },
                            {
                              condition: true,
                              label: translate("InventoryItemSealSticker"),
                              onClick: close(() => onSealSticker?.(uid))
                            }
                          ],
                          [
                            {
                              condition: true,
                              label: translate("InventoryItemDelete"),
                              onClick: close(async () => {
                                if (
                                  await confirm({
                                    titleText: item.name,
                                    bodyText: [
                                      translate(
                                        "InventoryItemDeleteConfirmDesc"
                                      ),
                                      getLoadoutItemWarning(uid)
                                    ]
                                      .filter(has)
                                      .join("\n"),
                                    cancelText: translate("GenericCancel"),
                                    confirmText: translate(
                                      "InventoryItemDeleteConfirm"
                                    )
                                  })
                                ) {
                                  onRemove?.(uid);
                                }
                              })
                            }
                          ]
                        ]
                      : isUseItemOnly
                        ? [
                            [
                              {
                                condition: true,
                                label: translate("InventoryItemUseItem"),
                                onClick: close(() => onUseItem?.(uid))
                              }
                            ]
                          ]
                        : [
                            [
                              {
                                condition: canInspect,
                                label: translate("InventoryItemInspect"),
                                onClick: close(() => onInspectItem?.(uid))
                              },
                              ...inspectInGameMenu
                            ],
                            ...getEquipMenu(
                              isEquippable
                                ? equippedInventory.getEquipOptions(item)
                                : [],
                              {
                                equip: (team) => onEquip?.(uid, team),
                                unequip: (team) => onUnequip?.(uid, team),
                                viewInLoadout: (team) => onViewInLoadout?.(team)
                              }
                            ).map((group) =>
                              group.map(({ label, onClick }) => ({
                                condition: true,
                                label: translate(label),
                                onClick: close(onClick)
                              }))
                            ),
                            [
                              {
                                condition: canUnlockContainer,
                                label: translate(
                                  "InventoryItemUnlockContainer"
                                ),
                                onClick: close(() => onUnlockContainer?.(uid))
                              },
                              {
                                condition: canUnsealGraffiti,
                                label: translate("InventoryItemUnsealGraffiti"),
                                onClick: close(() => onUnsealGraffiti?.(uid))
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
                                condition: canAttachCharm,
                                label: translate("ApplyKeychainUse"),
                                onClick: close(() => onAttachCharm?.(uid))
                              },
                              {
                                condition: canDetachCharm,
                                label: translate("InventoryItemDetachCharm"),
                                onClick: close(() => onDetachCharm?.(uid))
                              },
                              {
                                condition: canApplySticker,
                                label: translate("InventoryApplySticker"),
                                onClick: close(() => onApplySticker?.(uid))
                              },
                              {
                                condition: canSealSticker,
                                label: translate(
                                  "InventoryItemSealStickerInSlab"
                                ),
                                onClick: close(() => onSealSticker?.(uid))
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
                                condition: canExtractSticker,
                                label: translate("InventoryItemExtractSticker"),
                                onClick: close(() => onExtractSticker?.(uid))
                              }
                            ],
                            [
                              {
                                condition:
                                  isStorageUnit &&
                                  (inventory.canDepositToStorageUnit(uid) ||
                                    inventory.canRetrieveFromStorageUnit(uid)),
                                label: translate(
                                  "InventoryItemStorageUnitInspect"
                                ),
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
                                label: translate(
                                  "InventoryItemStorageUnitRetrieve"
                                ),
                                onClick: close(() =>
                                  onRetrieveFromStorageUnit?.(uid)
                                )
                              },
                              {
                                condition:
                                  isStorageUnit &&
                                  inventory.canDepositToStorageUnit(uid),
                                label: translate(
                                  "InventoryItemStorageUnitDeposit"
                                ),
                                onClick: close(() =>
                                  onDepositToStorageUnit?.(uid)
                                )
                              }
                            ],
                            [
                              {
                                condition: isStorageUnit,
                                label: hasNametag
                                  ? translate("InventoryItemRenameStorageUnit")
                                  : translate("InventoryItemUseStorageUnit"),
                                onClick: close(() => onRenameStorageUnit?.(uid))
                              },
                              {
                                condition: isNameablePet,
                                label: hasNametag
                                  ? translate("InventoryItemRenamePet")
                                  : translate("InventoryItemNamePet"),
                                onClick: close(() => onRenamePet?.(uid))
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
                                clickLabel: translate(
                                  "InventoryItemShareCopied"
                                ),
                                onClick: () =>
                                  copyToClipboard(
                                    getInventoryItemShareUrl(item, user?.id)
                                  )
                              },
                              {
                                condition: true,
                                label: translate("InventoryItemDelete"),
                                onClick: close(async () => {
                                  if (
                                    await confirm({
                                      titleText: item.name,
                                      bodyText: [
                                        translate(
                                          "InventoryItemDeleteConfirmDesc"
                                        ),
                                        getLoadoutItemWarning(uid)
                                      ]
                                        .filter(has)
                                        .join("\n"),
                                      cancelText: translate("GenericCancel"),
                                      confirmText: translate(
                                        "InventoryItemDeleteConfirm"
                                      )
                                    })
                                  ) {
                                    onRemove?.(uid);
                                  }
                                })
                              }
                            ]
                          ]
              }
            />
          </div>
        </FloatingFocusManager>
      )}
      {!isFreeInventoryItem &&
        !disableHover &&
        isHoverOpen &&
        (!hasContextMenu || !isClickOpen) && (
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
