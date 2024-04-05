/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cslib";
import { resolveCaseSpecialsImage } from "~/utils/economy";
import { CSItem } from "./cs-item";
import { useRootContext } from "./root-context";

export function CaseSpecialItem({ caseItem }: { caseItem: CS_Item }) {
  const {
    translations: { translate }
  } = useRootContext();

  return (
    <CSItem
      item={{
        id: -1,
        name: translate("CaseRareItem"),
        image: resolveCaseSpecialsImage(caseItem),
        type: "weapon",
        category: "weapon",
        rarity: "#e4ae39"
      }}
    />
  );
}
