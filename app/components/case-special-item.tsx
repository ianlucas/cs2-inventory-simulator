/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item, CS_resolveCaseSpecialItemImage } from "@ianlucas/cslib";
import { useTranslation } from "~/hooks/use-translation";
import { baseUrl } from "~/utils/economy";
import { CSItem } from "./cs-item";

export function CaseSpecialItem({
  caseItem
}: {
  caseItem: CS_Item;
}) {
  const translate = useTranslation();
  return (
    <CSItem
      item={{
        id: -1,
        name: translate("CaseRareItem"),
        image: CS_resolveCaseSpecialItemImage(
          baseUrl,
          caseItem
        ),
        type: "weapon",
        category: "weapon",
        rarity: "#e4ae39"
      }}
    />
  );
}
