/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { autoUpdate, flip, FloatingFocusManager, offset, shift, useDismiss, useFloating, useHover, useInteractions, useMergeRefs, useRole } from "@floating-ui/react";
import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS_Economy, CS_hasSeed, CS_hasWear, CS_INVENTORY_EQUIPPABLE_ITEMS, CS_MAX_WEAR, CS_MIN_SEED, CS_MIN_WEAR, CS_resolveItemImage, CS_Team, CS_TEAM_CT, CS_TEAM_T } from "@ianlucas/cslib";
import clsx from "clsx";
import { useState } from "react";
import { useAnyClick } from "~/hooks/floating-ui";
import { useTranslation } from "~/hooks/use-translation";
import { baseUrl } from "~/utils/economy";
import { transform } from "~/utils/inventory";
import { ContextButton } from "./context-button";
import { ContextDivider } from "./context-divider";
import { useRootContext } from "./root-context";

export function InventoryItem(
  {
    csItem,
    equipped,
    index,
    inventoryItem,
    model,
    name,
    onDelete,
    onEquip,
    onUnequip,
    readOnly
  }:
    & ReturnType<
      typeof transform
    >
    & {
      onDelete?(index: number): void;
      onEquip?(index: number, team?: CS_Team): void;
      onUnequip?(index: number, team?: CS_Team): void;
      readOnly?: boolean;
    }
) {
  const isAuthenticated = useRootContext().user !== undefined;
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
  } = useInteractions([
    click,
    dismiss,
    role
  ]);

  const {
    getReferenceProps: getHoverReferenceProps,
    getFloatingProps: getHoverFloatingProps
  } = useInteractions([
    hover
  ]);

  const ref = useMergeRefs([clickRefs.setReference, hoverRefs.setReference]);

  const canEquip = csItem.teams === undefined && !inventoryItem.equipped
    && CS_INVENTORY_EQUIPPABLE_ITEMS.includes(csItem.type);
  const canEquipT = csItem.teams?.includes(CS_TEAM_T)
    && !inventoryItem.equippedT;
  const canEquipCT = csItem.teams?.includes(CS_TEAM_CT)
    && !inventoryItem.equippedCT;
  const canUnequip = inventoryItem.equipped === true;
  const canUnequipT = inventoryItem.equippedT === true;
  const canUnequipCT = inventoryItem.equippedCT === true;

  const anyUnequip = canUnequip || canUnequipT || canUnequipCT;
  const anyEquip = canEquip || canEquipT || canEquipCT;
  const hasWear = !csItem.free && CS_hasWear(csItem);
  const hasSeed = !csItem.free && CS_hasSeed(csItem);
  const hasModel = model || inventoryItem.stattrak !== undefined;
  const hasAttributes = hasWear || hasSeed;

  function close(callbefore: () => void) {
    return function close() {
      callbefore();
      setIsClickOpen(false);
    };
  }

  return (
    <>
      <div
        className="hover:drop-shadow-[0_0_5px_rgba(0,0,0,1)] transition-all w-[154px]"
        ref={ref}
        {...getHoverReferenceProps(getClickReferenceProps())}
      >
        <div className="p-[1px] bg-gradient-to-b from-neutral-600 to-neutral-400 relative">
          <div className="bg-gradient-to-b from-neutral-500 to-neutral-300 px-1">
            <img
              className="w-[144px] h-[108px]"
              src={CS_resolveItemImage(
                baseUrl,
                csItem,
                inventoryItem.wear
              )}
              draggable={false}
              alt={csItem.name}
            />
          </div>
          <div className="absolute left-0 bottom-0 p-1 flex items-center">
            {inventoryItem.stickers !== undefined
              && inventoryItem.stickers.map(
                (sticker, index) =>
                  sticker !== null && (
                    <img
                      key={index}
                      className="h-5"
                      src={CS_Economy.getById(sticker).image}
                      alt={CS_Economy.getById(sticker).name}
                    />
                  )
              )}
          </div>
          {isAuthenticated && (
            <div className="absolute right-0 top-0 p-2 flex items-center gap-1">
              {equipped.map((color, colorIndex) => (typeof color === "string"
                ? (
                  <FontAwesomeIcon
                    key={colorIndex}
                    className={clsx("h-3.5 text-sky-300", color)}
                    icon={faCircleDot}
                  />
                )
                : null)
              )}
            </div>
          )}
        </div>
        <div
          className="shadow shadow-black/50 w-full h-1"
          style={{ backgroundColor: csItem.rarity }}
        />
        <div className="text-[12px] leading-3 mt-2 text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)]">
          {inventoryItem.nametag !== undefined
            ? <>"{inventoryItem.nametag}"</>
            : (
              <>
                {hasModel && (
                  <div className="font-bold">
                    {inventoryItem.stattrak !== undefined && "StatTrak™ "}
                    {model}
                  </div>
                )}
                <div className={clsx(csItem.free && "font-bold")}>{name}</div>
              </>
            )}
        </div>
      </div>
      {!readOnly && isClickOpen && (
        <FloatingFocusManager context={clickContext} modal={false}>
          <div
            className="z-10 bg-neutral-800 text-white outline-none py-2 w-[192px] text-sm rounded"
            ref={clickRefs.setFloating}
            style={clickStyles}
            {...getClickFloatingProps()}
          >
            {isAuthenticated && (
              <>
                {canEquip && (
                  <ContextButton onClick={close(() => onEquip?.(index))}>
                    {translate("InventoryItemEquip")}
                  </ContextButton>
                )}
                {canEquipT && (
                  <ContextButton
                    onClick={close(() => onEquip?.(index, CS_TEAM_T))}
                  >
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

                {(anyEquip || anyUnequip) && <ContextDivider />}
              </>
            )}
            <ContextButton
              onClick={close(() =>
                onDelete?.(index)
              )}
            >
              {translate("InventoryItemDelete")}
            </ContextButton>
          </div>
        </FloatingFocusManager>
      )}
      {!readOnly && isHoverOpen && !isClickOpen && (
        <FloatingFocusManager context={hoverContext} modal={false}>
          <div
            className="z-20 py-4 px-6 bg-neutral-900/95 rounded text-white outline-none text-sm"
            ref={hoverRefs.setFloating}
            style={hoverStyles}
            {...getHoverFloatingProps()}
          >
            {hasModel && (
              <div className="font-bold">
                {inventoryItem.stattrak !== undefined
                  && `${translate("InventoryItemStatTrak")} `} {model}
              </div>
            )}
            <div>{name}</div>
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
                    <div className="w-[128px] h-1 bg-[linear-gradient(90deg,#3b818f_0,#3b818f_7%,#83b135_0,#83b135_15%,#d7be47_0,#d7be47_38%,#f08140_0,#f08140_45%,#ec4f3d_0,#ec4f3d)] relative">
                      <div
                        className="absolute h-1.5 w-[1px] bg-white -top-0.5"
                        style={{
                          left: `${
                            ((inventoryItem.wear ?? CS_MIN_WEAR)
                              / CS_MAX_WEAR)
                            * 100
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
