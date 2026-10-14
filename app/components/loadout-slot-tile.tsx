/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  Placement,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useMergeRefs
} from "@floating-ui/react";
import { CS2BaseInventoryItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { MouseEvent, ReactNode, useState } from "react";
import { getSoundProps } from "~/interface-sounds";
import { toInventoryItem } from "~/shared/inventory";
import { LoadoutSlot, LoadoutTeam } from "~/shared/loadout";
import { ContextButton } from "./context-button";
import { useNameItemString } from "./hooks/use-name-item";
import { LoadoutIcon } from "./loadout-icon";
import { LoadoutItemImage } from "./loadout-item-image";
import { LoadoutTooltip } from "./loadout-tooltip";
import { TooltipBubble, useTooltip } from "./tooltip";

export interface LoadoutSlotMenuEntry {
  label: string;
  onClick: () => void;
}

export function LoadoutSlotTile({
  caption,
  className,
  disableTooltip,
  dropKey,
  emptyIcon,
  imageClassName,
  isDropHover,
  isFiltered,
  isValidTarget,
  item,
  menu,
  onClick,
  slot,
  team,
  tooltipPlacement
}: {
  caption?: ReactNode;
  className?: string;
  disableTooltip?: boolean;
  dropKey?: number;
  emptyIcon?: string;
  imageClassName?: string;
  isDropHover?: boolean;
  isFiltered?: boolean;
  isValidTarget?: boolean;
  item?: CS2InventoryItem | CS2BaseInventoryItem;
  menu: LoadoutSlotMenuEntry[];
  onClick?: (event: MouseEvent) => void;
  slot?: LoadoutSlot;
  team: LoadoutTeam;
  tooltipPlacement?: Placement;
}) {
  const nameItemString = useNameItemString();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getReferenceProps, setReference, tooltip } = useTooltip({
    durationMs: 150,
    offsetPx: 8,
    placement: tooltipPlacement ?? "right"
  });
  const { context, floatingStyles, refs } = useFloating({
    middleware: [offset(4), flip(), shift()],
    onOpenChange: setIsMenuOpen,
    open: isMenuOpen,
    placement: "right-start",
    whileElementsMounted: autoUpdate
  });
  const dismiss = useDismiss(context);
  const { getFloatingProps, getReferenceProps: getMenuReferenceProps } =
    useInteractions([dismiss]);
  const ref = useMergeRefs([setReference, refs.setReference]);
  const inventoryItem = item !== undefined ? toInventoryItem(item) : undefined;
  const isDropping = isDropHover && isValidTarget;

  return (
    <>
      <div
        className={clsx(
          "group/slot relative min-h-0 transition-colors duration-150",
          isDropping
            ? "bg-black/70"
            : "bg-black/25 hover:bg-[rgb(143_143_143/0.144)]",
          isValidTarget &&
            "shadow-[inset_0_0_12px_#1a1a1a67] outline-2 -outline-offset-2 outline-current outline-dashed",
          className
        )}
        data-loadout-slot={slot}
        data-loadout-team={slot !== undefined ? team : undefined}
        ref={ref}
        {...getSoundProps({ hover: "inventory_item_rollover" })}
        {...getReferenceProps(
          getMenuReferenceProps({
            onClick,
            onContextMenu(event) {
              event.preventDefault();
              setIsMenuOpen(menu.length > 0);
            }
          })
        )}
      >
        {item !== undefined ? (
          <LoadoutItemImage
            className={clsx(
              "absolute inset-0 transition-all duration-150 group-hover/slot:-translate-y-1 group-hover/slot:brightness-160 group-hover/slot:drop-shadow-[-3px_6px_6px_rgb(0_0_0/0.2)]",
              dropKey !== undefined && "animate-loadout-drop",
              isDropping && "opacity-30",
              imageClassName
            )}
            item={item}
            key={dropKey}
          />
        ) : (
          emptyIcon !== undefined && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadoutIcon className="size-6 text-white/80" src={emptyIcon} />
            </div>
          )
        )}
        {caption}
        {isFiltered && (
          <LoadoutIcon
            className="absolute top-1 left-1 size-3 opacity-80"
            src="/images/vectors/filter.svg"
          />
        )}
        {inventoryItem !== undefined && (
          <div
            className="absolute bottom-0 left-0 h-0.5 w-full"
            style={{ backgroundColor: inventoryItem.rarityColor }}
          />
        )}
      </div>
      {inventoryItem !== undefined && !disableTooltip && !isMenuOpen && (
        <TooltipBubble {...tooltip}>
          <LoadoutTooltip
            color={inventoryItem.rarityColor}
            modelKey={inventoryItem.modelKey}
            name={nameItemString(inventoryItem)}
          />
        </TooltipBubble>
      )}
      {isMenuOpen && (
        <FloatingPortal>
          <div
            className="font-display z-30 w-56 rounded-sm bg-neutral-800 py-2 text-sm text-white"
            ref={refs.setFloating}
            role="menu"
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {menu.map(({ label, onClick }) => (
              <ContextButton
                key={label}
                onClick={() => {
                  setIsMenuOpen(false);
                  onClick();
                }}
              >
                {label}
              </ContextButton>
            ))}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
