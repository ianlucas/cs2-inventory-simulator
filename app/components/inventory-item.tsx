import { autoUpdate, flip, FloatingFocusManager, offset, shift, useClick, useClientPoint, useDismiss, useFloating, useHover, useInteractions, useMergeRefs, useRole } from "@floating-ui/react";
import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { CS_Economy, CS_Inventory, CS_MIN_FLOAT, CS_MIN_SEED, CS_Team, CS_TEAM_CT, CS_TEAM_T } from "cslib";
import { useEffect, useState } from "react";
import { useAnyClick } from "~/hooks/floating-ui";
import { transform } from "~/utils/inventory";
import { ContextButton } from "./context-button";
import { ContextDivider } from "./context-divider";

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
    onUnequip
  }:
    & ReturnType<
      typeof transform
    >
    & {
      onDelete(index: number): void;
      onEquip(index: number, team?: CS_Team): void;
      onUnequip(index: number, team?: CS_Team): void;
    }
) {
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

  const canEquip = csItem.teams === undefined && !inventoryItem.equipped;
  const canEquipT = csItem.teams?.includes(CS_TEAM_T)
    && !inventoryItem.equippedT;
  const canEquipCT = csItem.teams?.includes(CS_TEAM_CT)
    && !inventoryItem.equippedCT;
  const canUnequip = inventoryItem.equipped === true;
  const canUnequipT = inventoryItem.equippedT === true;
  const canUnequipCT = inventoryItem.equippedCT === true;

  const anyUnequip = canUnequip || canUnequipT || canUnequipCT;
  const anyEquip = canEquip || canEquipT || canEquipCT;

  function close(callbefore: () => void) {
    return function close() {
      callbefore();
      setIsClickOpen(false);
    };
  }

  return (
    <>
      <div
        className="hover:drop-shadow-[0_0_5px_rgba(0,0,0,1)] transition-all"
        ref={ref}
        {...getHoverReferenceProps(getClickReferenceProps())}
      >
        <div className="p-[1px] bg-gradient-to-b from-neutral-600 to-neutral-400 relative">
          <div className="bg-gradient-to-b from-neutral-500 to-neutral-300 px-1">
            <img
              className="w-[144px] h-[108px]"
              src={CS_Economy.resolveImageSrc(
                "/localimage",
                inventoryItem.id,
                inventoryItem.float
              )}
              draggable={false}
            />
          </div>
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
        </div>
        <div
          className="shadow shadow-black/50 w-full h-1"
          style={{ backgroundColor: csItem.rarity }}
        />
        <div className="text-[12px] leading-3 mt-2 text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)]">
          <div className="font-bold">{model}</div>
          <div>{name}</div>
        </div>
      </div>
      {isClickOpen && (
        <FloatingFocusManager context={clickContext} modal={false}>
          <div
            className="z-10 bg-neutral-800 text-white outline-none py-2 w-[128px] text-sm rounded"
            ref={clickRefs.setFloating}
            style={clickStyles}
            {...getClickFloatingProps()}
          >
            {canUnequip && (
              <ContextButton onClick={close(() => onUnequip(index))}>
                Unequip T
              </ContextButton>
            )}
            {canUnequipT && (
              <ContextButton onClick={close(() => onUnequip(index, CS_TEAM_T))}>
                Unequip T
              </ContextButton>
            )}
            {canUnequipCT && (
              <ContextButton
                onClick={close(() => onUnequip(index, CS_TEAM_CT))}
              >
                Unequip CT
              </ContextButton>
            )}
            {anyUnequip && anyEquip && <ContextDivider />}
            {canEquip && (
              <ContextButton onClick={close(() => onEquip(index))}>
                Equip
              </ContextButton>
            )}
            {canEquipT && (
              <ContextButton onClick={close(() => onEquip(index, CS_TEAM_T))}>
                Equip T
              </ContextButton>
            )}
            {canEquipCT && (
              <ContextButton onClick={close(() => onEquip(index, CS_TEAM_CT))}>
                Equip CT
              </ContextButton>
            )}
            <ContextDivider />
            <ContextButton
              onClick={close(() =>
                onDelete(index)
              )}
            >
              Delete
            </ContextButton>
          </div>
        </FloatingFocusManager>
      )}
      {isHoverOpen && !isClickOpen && (
        <FloatingFocusManager context={hoverContext} modal={false}>
          <div
            className="z-50 py-4 px-6 bg-neutral-900/90 rounded text-white outline-none text-sm"
            ref={hoverRefs.setFloating}
            style={hoverStyles}
            {...getHoverFloatingProps()}
          >
            <div className="font-bold">{model}</div>
            <div>{name}</div>
            {CS_Economy.hasFloat(csItem) && (
              <div className="mt-2">
                <strong className="text-neutral-400">Float:</strong>{" "}
                {inventoryItem.float ?? CS_MIN_FLOAT}
              </div>
            )}
            {CS_Economy.hasSeed(csItem) && (
              <div>
                <strong className="text-neutral-400">Seed:</strong>{" "}
                {inventoryItem.seed ?? CS_MIN_SEED}
              </div>
            )}
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
}
