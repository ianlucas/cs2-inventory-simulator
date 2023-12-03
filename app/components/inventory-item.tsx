/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  offset,
  shift,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole
} from "@floating-ui/react";
import {
  CS_hasSeed,
  CS_hasWear,
  CS_INVENTORY_EQUIPPABLE_ITEMS,
  CS_Item,
  CS_MAX_WEAR,
  CS_MIN_SEED,
  CS_MIN_WEAR,
  CS_NAMETAG_TOOL_DEF,
  CS_Team,
  CS_TEAM_CT,
  CS_TEAM_T
} from "@ianlucas/cslib";
import clsx from "clsx";
import { useState } from "react";
import { useAnyClick } from "~/hooks/use-any-click";
import { useTranslation } from "~/hooks/use-translation";
import { transform } from "~/utils/inventory";
import { ContextButton } from "./context-button";
import { ContextDivider } from "./context-divider";
import { CSItem } from "./cs-item";

export function InventoryItem({
  disableContextMenu,
  disableHover,
  equipped,
  index,
  inventoryItem,
  item,
  model,
  name,
  onClick,
  onEquip,
  onRemove,
  onRename,
  onUnequip,
  onUnlockContainer
}: ReturnType<typeof transform> & {
  disableContextMenu?: boolean;
  disableHover?: boolean;
  onClick?(index: number, item: CS_Item): void;
  onEquip?(index: number, team?: CS_Team): void;
  onRemove?(index: number): void;
  onRename?(index: number, item: CS_Item): void;
  onUnequip?(index: number, team?: CS_Team): void;
  onUnlockContainer?(index: number, item: CS_Item): void;
}) {
  const stubInventoryItem = index < 0;
  const translate = useTranslation();
  const [isClickOpen, setIsClickOpen] = useState(false);
  const [isHoverOpen, setIsHoverOpen] = useState(false);

  const {
    refs: clickRefs,
    floatingStyles: clickStyles,
    context: clickContext
  } = useFloating({
    open: isClickOpen,
    onOpenChange: setIsClickOpen,
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
    placement: "right"
  });

  const {
    refs: hoverRefs,
    floatingStyles: hoverStyles,
    context: hoverContext
  } = useFloating({
    open: isHoverOpen,
    onOpenChange: setIsHoverOpen,
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
    placement: "right"
  });

  const click = useAnyClick(clickContext);
  const dismiss = useDismiss(clickContext);
  const role = useRole(clickContext);
  const hover = useHover(hoverContext);

  const {
    getReferenceProps: getClickReferenceProps,
    getFloatingProps: getClickFloatingProps
  } = useInteractions([click, dismiss, role]);

  const {
    getReferenceProps: getHoverReferenceProps,
    getFloatingProps: getHoverFloatingProps
  } = useInteractions([hover]);

  const ref = useMergeRefs([clickRefs.setReference, hoverRefs.setReference]);

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

  const anyUnequip = canUnequip || canUnequipT || canUnequipCT;
  const anyEquip = canEquip || canEquipT || canEquipCT;
  const hasWear = !item.free && CS_hasWear(item);
  const hasSeed = !item.free && CS_hasSeed(item);
  const hasModel = model || inventoryItem.stattrak !== undefined;
  const hasAttributes = hasWear || hasSeed;
  const canRename = item.type == "tool" && item.def === CS_NAMETAG_TOOL_DEF;
  const canUnlockContainer = ["case", "key"].includes(item.type);

  function close(callbefore: () => void) {
    return function close() {
      callbefore();
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
            {canEquip && (
              <ContextButton onClick={close(() => onEquip?.(index))}>
                {translate("InventoryItemEquip")}
              </ContextButton>
            )}
            {canEquipT && (
              <ContextButton onClick={close(() => onEquip?.(index, CS_TEAM_T))}>
                {translate("InventoryItemEquipT")}
              </ContextButton>
            )}
            {canEquipCT && (
              <ContextButton
                onClick={close(() => onEquip?.(index, CS_TEAM_CT))}
              >
                {translate("InventoryItemEquipCT")}
              </ContextButton>
            )}
            {canEquipCT && canEquipT && (
              <ContextButton
                onClick={close(() => {
                  onEquip?.(index, CS_TEAM_CT);
                  onEquip?.(index, CS_TEAM_T);
                })}
              >
                {translate("InventoryItemEquipBothTeams")}
              </ContextButton>
            )}
            {anyEquip && <ContextDivider />}
            {canUnequip && (
              <ContextButton onClick={close(() => onUnequip?.(index))}>
                {translate("InventoryItemUnequip")}
              </ContextButton>
            )}
            {canUnequipT && (
              <ContextButton
                onClick={close(() => onUnequip?.(index, CS_TEAM_T))}
              >
                {translate("InventoryItemUnequipT")}
              </ContextButton>
            )}
            {canUnequipCT && (
              <ContextButton
                onClick={close(() => onUnequip?.(index, CS_TEAM_CT))}
              >
                {translate("InventoryItemUnequipCT")}
              </ContextButton>
            )}

            {anyUnequip && <ContextDivider />}

            {canUnlockContainer && (
              <ContextButton onClick={() => onUnlockContainer?.(index, item)}>
                {translate("InventoryItemUnlockContainer")}
              </ContextButton>
            )}

            {canUnlockContainer && <ContextDivider />}

            {canRename && (
              <ContextButton onClick={() => onRename?.(index, item)}>
                {translate("InventoryItemRename")}
              </ContextButton>
            )}

            {canRename && <ContextDivider />}

            <ContextButton onClick={close(() => onRemove?.(index))}>
              {translate("InventoryItemDelete")}
            </ContextButton>
          </div>
        </FloatingFocusManager>
      )}
      {!stubInventoryItem && !disableHover && isHoverOpen && !isClickOpen && (
        <FloatingFocusManager context={hoverContext} modal={false}>
          <div
            className="z-20 rounded bg-neutral-900/95 px-6 py-4 text-sm text-white outline-none"
            ref={hoverRefs.setFloating}
            style={hoverStyles}
            {...getHoverFloatingProps()}
          >
            {hasModel && (
              <div className="font-bold">
                {inventoryItem.stattrak !== undefined &&
                  `${translate("InventoryItemStatTrak")} `}{" "}
                {model}
              </div>
            )}
            <div className={clsx(!hasModel && "font-bold")}>{name}</div>
            {hasAttributes && (
              <div className="mt-2 flex flex-col gap-2">
                {hasWear && (
                  <div>
                    <div>
                      <strong className="text-neutral-400">
                        {translate("InventoryItemWear")}
                      </strong>{" "}
                      {inventoryItem.wear ?? CS_MIN_WEAR}
                    </div>
                    <div className="relative h-1 w-[128px] bg-[linear-gradient(90deg,#3b818f_0,#3b818f_7%,#83b135_0,#83b135_15%,#d7be47_0,#d7be47_38%,#f08140_0,#f08140_45%,#ec4f3d_0,#ec4f3d)]">
                      <div
                        className="absolute -top-0.5 h-1.5 w-[1px] bg-white"
                        style={{
                          left: `${
                            ((inventoryItem.wear ?? CS_MIN_WEAR) /
                              CS_MAX_WEAR) *
                            100
                          }%`
                        }}
                      />
                    </div>
                  </div>
                )}
                {hasSeed && (
                  <div>
                    <strong className="text-neutral-400">
                      {translate("InventoryItemSeed")}
                    </strong>{" "}
                    {inventoryItem.seed ?? CS_MIN_SEED}
                  </div>
                )}
              </div>
            )}
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
}
