/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2UnlockedItem } from "@ianlucas/cs2-lib";
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
    caseItem: CS2EconomyItem;
    instant?: boolean;
    items: CS2UnlockedItem[];
    translateX: number;
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      className={clsx(
        "h-48 whitespace-nowrap",
        !instant && "[transition:all_6s_cubic-bezier(0,0.11,0.33,1)_0s]"
      )}
      ref={ref}
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
