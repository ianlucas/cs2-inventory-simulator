/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy, CS_Item } from "@ianlucas/cs2-lib";
import { ElementRef, useEffect, useRef, useState } from "react";
import { CaseSpecialItem } from "./case-special-item";
import { CSItem } from "./cs-item";
import { useRootContext } from "./root-context";

export function UnlockCaseContainerContents({
  caseItem,
  hideCaseContents
}: {
  caseItem: CS_Item;
  hideCaseContents: boolean;
}) {
  const {
    translations: { translate }
  } = useRootContext();

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
      className="absolute w-full -translate-y-full rounded [transition:all_cubic-bezier(0.4,0,0.2,1)_1s]"
      style={{
        transform: `translateY(${translateY}px)`,
        opacity
      }}
      ref={ref}
    >
      <div className="m-auto max-w-[1024px]">
        <h2 className="my-2">{translate("CaseContainsOne")}</h2>
        <div className="flex h-[320px] flex-wrap gap-3 overflow-y-scroll pb-4">
          {[
            ...CS_Economy.listCaseContents(caseItem, true).map(
              (item, index) => <CSItem key={index} item={item} />
            ),
            caseItem.specials !== undefined && (
              <CaseSpecialItem key={-1} caseItem={caseItem} />
            )
          ]}
        </div>
      </div>
    </div>
  );
}
