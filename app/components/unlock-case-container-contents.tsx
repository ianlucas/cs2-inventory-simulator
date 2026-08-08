/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FloatingFocusManager } from "@floating-ui/react";
import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { ComponentRef, useEffect, useRef, useState } from "react";
import { useTranslate } from "./app-context";
import { useInventoryItemFloating } from "./hooks/use-inventory-item-floating";
import { InventoryItemContextMenu } from "./inventory-item-context-menu";
import { InventoryItemTile } from "./inventory-item-tile";
import { InventoryItemTileSpecial } from "./inventory-item-tile-special";
import { ModalButton } from "./modal-button";
import { Presence } from "./presence";
import { UnlockCaseContentsInspect } from "./unlock-case-contents-inspect";

function UnlockCaseContainerContentsItem({
  item,
  onInspect
}: {
  item: CS2EconomyItem;
  onInspect: () => void;
}) {
  const {
    clickContext,
    clickRefs,
    clickStyles,
    getClickFloatingProps,
    getClickReferenceProps,
    isClickOpen,
    setIsClickOpen
  } = useInventoryItemFloating();
  const translate = useTranslate();

  return (
    <>
      <div
        className="relative w-30"
        ref={clickRefs.setReference}
        tabIndex={0}
        {...getClickReferenceProps()}
      >
        <InventoryItemTile item={item} small />
      </div>
      {isClickOpen && (
        <FloatingFocusManager context={clickContext} modal={false}>
          <div
            role="menu"
            className="font-display z-60 w-48 rounded-sm bg-neutral-800 py-2 text-sm text-white outline-hidden"
            ref={clickRefs.setFloating}
            style={clickStyles}
            {...getClickFloatingProps()}
          >
            <InventoryItemContextMenu
              menu={[
                [
                  {
                    condition: true,
                    label: translate("InventoryItemInspect"),
                    onClick: () => {
                      setIsClickOpen(false);
                      onInspect();
                    }
                  }
                ]
              ]}
            />
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
}

export function UnlockCaseContainerContents({
  caseItem,
  hideCaseContents
}: {
  caseItem: CS2EconomyItem;
  hideCaseContents: boolean;
}) {
  const translate = useTranslate();
  const [translateY, setTranslateY] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const [inspectItemIndex, setInspectItemIndex] = useState<number>();
  const items = caseItem.listContents(true);

  const ref = useRef<ComponentRef<"div">>(null);

  useEffect(() => {
    setOpacity(1);
    if (hideCaseContents) {
      setTranslateY(9999);
    } else {
      setTranslateY(ref.current !== null ? -ref.current.clientHeight : 0);
    }
  }, [hideCaseContents, ref]);

  return (
    <div
      className="absolute w-full rounded-sm backdrop-blur-md [transition:all_cubic-bezier(0.4,0,0.2,1)_1s]"
      style={{
        transform: `translateY(${translateY}px)`,
        opacity
      }}
      ref={ref}
    >
      <div className="m-auto lg:max-w-5xl">
        <h2 className="relative block border-b border-b-white/20 py-3 text-center text-sm">
          {translate("CaseContainsOne")}
          <div className="absolute top-0 right-0 flex h-full items-center">
            <ModalButton
              variant="secondary"
              onClick={() => setInspectItemIndex(0)}
            >
              {translate("CaseInspectAll")}
            </ModalButton>
          </div>
        </h2>
        <div className="scrollbar-transparent mt-4 flex h-80 flex-wrap gap-5 overflow-y-scroll px-4 pb-4">
          {[
            ...items.map((item, index) => (
              <UnlockCaseContainerContentsItem
                item={item}
                key={index}
                onInspect={() => setInspectItemIndex(index)}
              />
            )),
            caseItem.specials !== undefined && (
              <InventoryItemTileSpecial
                key={-1}
                containerItem={caseItem}
                small
              />
            )
          ]}
        </div>
      </div>
      <Presence present={inspectItemIndex !== undefined}>
        {inspectItemIndex !== undefined && (
          <UnlockCaseContentsInspect
            caseItem={caseItem}
            initialItemIndex={inspectItemIndex}
            items={items}
            onClose={() => setInspectItemIndex(undefined)}
          />
        )}
      </Presence>
    </div>
  );
}
