/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item, CS_listCaseContents } from "@ianlucas/cslib";
import { CSItem } from "./cs-item";
import { CaseSpecialItem } from "./case-special-item";
import { useTranslation } from "~/hooks/use-translation";

export function CaseOpeningCaseContents({
  caseItem,
  hideCaseContents
}: {
  caseItem: CS_Item;
  hideCaseContents: boolean;
}) {
  const translate = useTranslation();

  return (
    <div
      className="m-auto max-w-[1024px] rounded bg-gradient-to-b from-transparent to-white/20 p-2 [transition:all_cubic-bezier(0.4,0,0.2,1)_1s]"
      style={{
        transform: `translateY(${hideCaseContents ? 9999 : 0}px)`
      }}
    >
      <h2 className="my-2 border-b border-b-white/50 pb-2">
        {translate("CaseContainsOne")}
      </h2>
      <div className="flex h-[320px] flex-wrap gap-3 overflow-y-scroll">
        {[
          ...CS_listCaseContents(caseItem, true).map((item, index) => (
            <CSItem key={index} item={item} />
          )),
          caseItem.specialcontents !== undefined && (
            <CaseSpecialItem key={-1} caseItem={caseItem} />
          )
        ]}
      </div>
    </div>
  );
}
