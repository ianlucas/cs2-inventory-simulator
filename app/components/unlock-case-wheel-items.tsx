/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy, CS_Item } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { ForwardedRef, forwardRef } from "react";
import { UnlockCaseWheelItem } from "./unlock-case-wheel-item";

export const UnlockCaseWheelItems = forwardRef(function Items(
  {
    caseItem,
    instant,
    items,
    translateX
  }: {
    caseItem: CS_Item;
    instant?: boolean;
    items: ReturnType<typeof CS_Economy.unlockCase>[];
    translateX: number;
  },
  ref: ForwardedRef<Element>
) {
  return (
    <div
      className={clsx(
        "h-[192px] whitespace-nowrap",
        !instant && "[transition:all_6s_cubic-bezier(0,0.11,0.33,1)_0s]"
      )}
      ref={ref as any}
      style={{ transform: `translate(${translateX}px, 0)` }}
    >
      {items.map((item, index) => (
        <UnlockCaseWheelItem
          caseItem={caseItem}
          index={index}
          key={index}
          unlockedItem={item}
        />
      ))}
    </div>
  );
});
