/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item, CS_randomInt, CS_unlockCase } from "@ianlucas/cslib";
import { useRef, useState } from "react";
import { useDetectCollision } from "~/hooks/use-detect-collision";
import { useResponsiveScale } from "~/hooks/use-responsive-scale";
import { playSound } from "~/utils/sound";
import { CaseOpeningWheelItems } from "./case-opening-wheel-items";

export function CaseOpeningWheel({
  caseItem,
  isDisplaying,
  items
}: {
  caseItem: CS_Item;
  isDisplaying: boolean;
  items: ReturnType<typeof CS_unlockCase>[];
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const hitsRef = useRef<HTMLDivElement>(null);
  const scale = useResponsiveScale();
  const [offset] = useState(CS_randomInt(188, 440));
  const scaleY = isDisplaying ? 1 : 0;
  // Stops at items[28] with an offset.
  const translateX = isDisplaying ? -29 * 256 + offset : 0;

  useDetectCollision({
    disabled: !isDisplaying,
    target: targetRef,
    hits: hitsRef,
    then() {
      playSound("/roll.mp3");
    }
  });

  return (
    <div style={{ transform: `scale(${scale})` }}>
      <div
        className="relative h-[496.8px] w-[1269.980px] [transition:all_cubic-bezier(0.4,0,0.2,1)_250ms]"
        style={{ transform: `scaleY(${scaleY})` }}
      >
        <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center opacity-90 blur-[2px] [-webkit-mask-image:radial-gradient(circle_closest-side,#fff0_246px,#000_246px)]">
          <div className="h-[192px] w-[1269.980px] overflow-hidden [-webkit-mask-image:linear-gradient(to_left,#fff0_0%,#000_10%,#000_90%,#fff0_100%)]">
            <CaseOpeningWheelItems
              items={items}
              caseItem={caseItem}
              translateX={translateX}
              instant={!isDisplaying}
            />
          </div>
        </div>
        <div className="absolute left-0 top-0 flex w-full scale-[1.15] items-center justify-center opacity-95">
          <div className="relative flex h-[496.8px] w-[1269.980px] items-center bg-black/50 [clip-path:circle(22.7%_at_50%_50%)]">
            <CaseOpeningWheelItems
              ref={hitsRef}
              items={items}
              caseItem={caseItem}
              translateX={translateX}
              instant={!isDisplaying}
            />
          </div>
        </div>
        <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center">
          <div
            ref={targetRef}
            className="h-[220.8px] w-1 bg-[#aeb035] shadow shadow-black"
          />
        </div>
      </div>
    </div>
  );
}
