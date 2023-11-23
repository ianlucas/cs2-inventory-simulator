/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item, CS_resolveCaseRareImage } from "@ianlucas/cslib";
import { useTranslation } from "~/hooks/use-translation";
import { baseUrl } from "~/utils/economy";
import { CSItem } from "./cs-item";

export function CaseRareItem({
  caseItem
}: {
  caseItem: CS_Item;
}) {
  const translate = useTranslation();
  return (
    <CSItem
      csItem={{
        id: -1,
        name: translate("CaseRareItem"),
        image: CS_resolveCaseRareImage(
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
