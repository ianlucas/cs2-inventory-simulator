/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cs2-lib";
import { resolveCaseSpecialsImage } from "~/utils/economy";
import { CSItemTile } from "./cs-item-tile";
import { useRootContext } from "./root-context";

export function CaseSpecialItem({ caseItem }: { caseItem: CS_Item }) {
  const {
    translations: { translate }
  } = useRootContext();

  return (
    <CSItemTile
      item={{
        id: caseItem.id,
        name: translate("CaseRareItem"),
        image: resolveCaseSpecialsImage(caseItem),
        type: "weapon",
        category: "weapon",
        rarity: "#e4ae39"
      }}
    />
  );
}
