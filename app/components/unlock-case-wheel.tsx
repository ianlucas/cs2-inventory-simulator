/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2UnlockedItem, randomInt } from "@ianlucas/cs2-lib";
import { ComponentRef, useRef, useState } from "react";
import { useDetectCollision } from "~/components/hooks/use-detect-collision";
import { useResponsiveScale } from "~/components/hooks/use-responsive-scale";
import { playSound } from "~/utils/sound";
import { UnlockCaseWheelItems } from "./unlock-case-wheel-items";

export function UnlockCaseWheel({
  caseItem,
  isDisplaying,
  items
}: {
  caseItem: CS2EconomyItem;
  isDisplaying: boolean;
  items: CS2UnlockedItem[];
}) {
  const targetRef = useRef<ComponentRef<"div">>(null);
  const hitsRef = useRef<ComponentRef<"div">>(null);
  const scale = useResponsiveScale();
  const [offset] = useState(randomInt(188, 440));
  const scaleY = isDisplaying ? 1 : 0;
  // Stops at items[28] with an offset.
  const translateX = isDisplaying ? -29 * 256 + offset : 0;

  useDetectCollision({
    disabled: !isDisplaying,
    target: targetRef,
    hits: hitsRef,
    then() {
      playSound("case_scroll");
    }
  });

  return (
    <div
      className="flex justify-center"
      style={{ transform: `scale(${scale})` }}
    >
      <div
        className="relative h-[496.8px] w-[1269.980px] [transition:all_cubic-bezier(0.4,0,0.2,1)_250ms]"
        style={{ transform: `scaleY(${scaleY})` }}
      >
        <div className="absolute top-0 left-0 flex h-full w-full items-center justify-center opacity-90 blur-[2px] [-webkit-mask-image:radial-gradient(circle_closest-side,#fff0_246px,#000_246px)]">
          <div className="h-[192px] w-[1269.980px] overflow-hidden [-webkit-mask-image:linear-gradient(to_left,#fff0_0%,#000_10%,#000_90%,#fff0_100%)]">
            <UnlockCaseWheelItems
              items={items}
              caseItem={caseItem}
              translateX={translateX}
              instant={!isDisplaying}
            />
          </div>
        </div>
        <div className="absolute top-0 left-0 flex w-full scale-[1.128] items-center justify-center opacity-95">
          <div className="relative flex h-[496.8px] w-[1269.980px] items-center bg-black/50 [clip-path:circle(22.7%_at_50%_50%)]">
            <UnlockCaseWheelItems
              ref={hitsRef}
              items={items}
              caseItem={caseItem}
              translateX={translateX}
              instant={!isDisplaying}
            />
          </div>
        </div>
        <div className="absolute top-0 left-0 flex h-full w-full items-center justify-center">
          <div
            ref={targetRef}
            className="h-[220.8px] w-1 bg-[#aeb035] shadow-sm shadow-black"
          />
        </div>
      </div>
    </div>
  );
}
