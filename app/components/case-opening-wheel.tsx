/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item, CS_randomInt, CS_roll } from "@ianlucas/cslib";
import { RefObject, useState } from "react";
import { CaseOpeningWheelItems } from "./case-opening-wheel-items";

export function CaseOpeningWheel({
  scale,
  items,
  hitsRef,
  targetRef,
  caseItem,
  isDisplaying
}: {
  scale: number;
  items: ReturnType<typeof CS_roll>[];
  hitsRef: RefObject<HTMLDivElement>;
  targetRef: RefObject<HTMLDivElement>;
  caseItem: CS_Item;
  isDisplaying: boolean;
}) {
  const [offset] = useState(CS_randomInt(188, 440));
  const scaleY = isDisplaying ? 1 : 0;
  // Stops at items[28] with an offset.
  const translateX = isDisplaying ? (-29 * 256) + offset : 0;

  return (
    <div style={{ transform: `scale(${scale})` }}>
      <div
        className="relative w-[1269.980px] h-[496.8px] [transition:all_cubic-bezier(0.4,0,0.2,1)_250ms]"
        style={{ transform: `scaleY(${scaleY})` }}
      >
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center blur-[2px] opacity-90 [-webkit-mask-image:radial-gradient(circle_closest-side,#fff0_246px,#000_246px)]">
          <div className="h-[192px] overflow-hidden w-[1269.980px] [-webkit-mask-image:linear-gradient(to_left,#fff0_0%,#000_10%,#000_90%,#fff0_100%)]">
            <CaseOpeningWheelItems
              items={items}
              caseItem={caseItem}
              translateX={translateX}
              instant={!isDisplaying}
            />
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full flex items-center justify-center scale-[1.15] opacity-95">
          <div className="w-[1269.980px] h-[496.8px] bg-black/50 flex items-center relative [clip-path:circle(22.7%_at_50%_50%)]">
            <CaseOpeningWheelItems
              ref={hitsRef}
              items={items}
              caseItem={caseItem}
              translateX={translateX}
              instant={!isDisplaying}
            />
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <div
            ref={targetRef}
            className="w-1 shadow shadow-black bg-[#aeb035] h-[220.8px]"
          />
        </div>
      </div>
    </div>
  );
}
