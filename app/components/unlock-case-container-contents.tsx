/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { ElementRef, useEffect, useRef, useState } from "react";
import { useLocalize } from "./app-context";
import { InventoryItemTile } from "./inventory-item-tile";
import { InventoryItemTileSpecial } from "./inventory-item-tile-special";

export function UnlockCaseContainerContents({
  caseItem,
  hideCaseContents
}: {
  caseItem: CS2EconomyItem;
  hideCaseContents: boolean;
}) {
  const localize = useLocalize();
  const [translateY, setTranslateY] = useState(0);
  const [opacity, setOpacity] = useState(0);

  const ref = useRef<ElementRef<"div">>(null);

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
      className="absolute w-full rounded-sm [transition:all_cubic-bezier(0.4,0,0.2,1)_1s]"
      style={{
        transform: `translateY(${translateY}px)`,
        opacity
      }}
      ref={ref}
    >
      <div className="m-auto lg:max-w-[1024px]">
        <h2 className="my-2">{localize("CaseContainsOne")}</h2>
        <div className="flex h-[320px] flex-wrap gap-3 overflow-y-scroll pb-4">
          {[
            ...caseItem
              .listContents(true)
              .map((item, index) => (
                <InventoryItemTile key={index} item={item} />
              )),
            caseItem.specials !== undefined && (
              <InventoryItemTileSpecial key={-1} containerItem={caseItem} />
            )
          ]}
        </div>
      </div>
    </div>
  );
}
