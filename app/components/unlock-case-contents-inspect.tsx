/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faChevronLeft,
  faChevronRight
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CS2BaseInventoryItem } from "@ianlucas/cs2-lib";
import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useViewer } from "~/components/hooks/use-viewer";
import { useViewerAvailability } from "~/components/hooks/use-viewer-availability";
import { useViewerStatus } from "~/components/hooks/use-viewer-status";
import { useTranslate } from "./app-context";
import { useKeyRelease } from "./hooks/use-key-release";
import { InGameOverlay } from "./in-game-overlay";
import { InspectItemHeader } from "./inspect-item";
import { ItemDescription } from "./item-description";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { UseItemFooter } from "./use-item-footer";
import { ViewerOverlay } from "./viewer-overlay";

function CaseContentsInspectHeader({
  caseItem,
  item,
  itemIndex,
  items,
  onNavigate
}: {
  caseItem: CS2EconomyItem;
  item: CS2EconomyItem;
  itemIndex: number;
  items: CS2EconomyItem[];
  onNavigate: (direction: -1 | 1) => void;
}) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const previousItem = items[itemIndex - 1];
  const nextItem = items[itemIndex + 1];

  return (
    <>
      <div className="h-4" />
      <div className="absolute top-4 left-0 w-full text-xs text-white/85 drop-shadow-sm">
        {translate("CaseInspecting", nameItemString(caseItem))}{" "}
        <strong className="text-sm">
          {itemIndex + 1}/{items.length}
        </strong>
      </div>
      <InspectItemHeader item={item} />
      <div className="pointer-events-auto fixed inset-x-8 top-12 z-10 mx-auto flex max-w-5xl justify-between">
        <CaseContentsInspectNavigation
          direction={-1}
          item={previousItem}
          onNavigate={onNavigate}
        />
        <CaseContentsInspectNavigation
          direction={1}
          item={nextItem}
          onNavigate={onNavigate}
        />
      </div>
    </>
  );
}

function CaseContentsInspectNavigation({
  direction,
  item,
  onNavigate
}: {
  direction: -1 | 1;
  item?: CS2EconomyItem;
  onNavigate: (direction: -1 | 1) => void;
}) {
  const nameItemString = useNameItemString();
  const unavailable = item === undefined;
  const alignment =
    direction === -1 ? "items-start text-left" : "items-end text-right";

  return (
    <button
      aria-label={
        unavailable
          ? undefined
          : `${direction === -1 ? "Previous" : "Next"}: ${nameItemString(item)}`
      }
      className={clsx(
        "flex max-w-64 flex-col gap-1 text-xs text-white/80 drop-shadow transition-opacity",
        alignment,
        unavailable ? "opacity-40" : "hover:text-white"
      )}
      disabled={unavailable}
      onClick={() => onNavigate(direction)}
      type="button"
    >
      <FontAwesomeIcon
        className="h-13"
        icon={direction === -1 ? faChevronLeft : faChevronRight}
      />
      {item !== undefined && (
        <span className="flex items-center gap-1 whitespace-nowrap">
          {direction === -1 && (
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: item.rarityColor }}
            />
          )}
          {nameItemString(item)}
          {direction === 1 && (
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: item.rarityColor }}
            />
          )}
        </span>
      )}
    </button>
  );
}

function CaseContentsInspectDisplay({
  caseItem,
  item,
  itemIndex,
  items,
  isFading,
  onClose,
  onNavigate
}: {
  caseItem: CS2EconomyItem;
  item: CS2EconomyItem;
  itemIndex: number;
  items: CS2EconomyItem[];
  isFading: boolean;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
}) {
  const translate = useTranslate();
  const previewItem: CS2BaseInventoryItem = {
    id: item.id,
    seed: item.getPreviewSeed(),
    wear: item.getMinimumWear()
  };
  const { api, viewerProps } = useViewer({ item: previewItem });
  const { canUse3d } = useViewerAvailability(previewItem);
  useViewerStatus(api);

  const header = (
    <CaseContentsInspectHeader
      caseItem={caseItem}
      item={item}
      itemIndex={itemIndex}
      items={items}
      onNavigate={onNavigate}
    />
  );
  const footer = (
    <div className="pointer-events-none absolute bottom-8 left-0 w-full">
      <div className="scrollbar-transparent m-auto max-h-48 max-w-5xl overflow-y-auto px-24 pb-4 lg:w-5xl">
        <ItemDescription item={item} />
      </div>
      <UseItemFooter
        right={
          <ModalButton
            variant="secondary"
            onClick={onClose}
            children={translate("InspectClose")}
          />
        }
      />
    </div>
  );

  return canUse3d ? (
    <ViewerOverlay
      header={header}
      overlayClassName={clsx(
        "z-60 transition-opacity duration-50",
        isFading ? "opacity-0" : "opacity-100"
      )}
      viewerProps={viewerProps}
    >
      {footer}
    </ViewerOverlay>
  ) : (
    createPortal(
      <InGameOverlay
        header={header}
        overlayClassName={clsx(
          "z-60 transition-opacity duration-50",
          isFading ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="flex size-full items-center justify-center">
          <ItemImage className="w-lg" item={item} wear={previewItem.wear} />
        </div>
        {footer}
      </InGameOverlay>,
      document.body
    )
  );
}

export function UnlockCaseContentsInspect({
  caseItem,
  initialItemIndex,
  items,
  onClose
}: {
  caseItem: CS2EconomyItem;
  initialItemIndex: number;
  items: CS2EconomyItem[];
  onClose: () => void;
}) {
  const [itemIndex, setItemIndex] = useState(initialItemIndex);
  const [isFading, setIsFading] = useState(false);
  const pendingItemIndex = useRef(initialItemIndex);
  const transitionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const transitionFrame = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      transitionTimers.current.forEach(clearTimeout);
      if (transitionFrame.current !== undefined) {
        cancelAnimationFrame(transitionFrame.current);
      }
    };
  }, []);

  function clearTransition() {
    transitionTimers.current.forEach(clearTimeout);
    if (transitionFrame.current !== undefined) {
      cancelAnimationFrame(transitionFrame.current);
    }
  }

  useKeyRelease("Escape", onClose);

  function onNavigate(direction: -1 | 1) {
    const nextItemIndex = Math.max(
      0,
      Math.min(items.length - 1, pendingItemIndex.current + direction)
    );
    if (nextItemIndex === pendingItemIndex.current) {
      return;
    }
    pendingItemIndex.current = nextItemIndex;
    clearTransition();
    setIsFading(true);
    transitionTimers.current = [
      setTimeout(() => {
        setItemIndex(pendingItemIndex.current);
        transitionFrame.current = requestAnimationFrame(() => {
          setIsFading(false);
        });
      }, 50)
    ];
  }

  const item = items[itemIndex];
  if (item === undefined) {
    return null;
  }

  return (
    <CaseContentsInspectDisplay
      key={itemIndex}
      caseItem={caseItem}
      item={item}
      itemIndex={itemIndex}
      items={items}
      isFading={isFading}
      onClose={onClose}
      onNavigate={onNavigate}
    />
  );
}
