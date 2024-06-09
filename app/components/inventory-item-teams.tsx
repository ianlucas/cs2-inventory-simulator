/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Team, CS2TeamValues } from "@ianlucas/cs2-lib";
import { useLocalize } from "./app-context";
import { InventoryItemInfo } from "./inventory-item-info";

export function InventoryItemTeams({ teams }: { teams?: CS2TeamValues[] }) {
  const localize = useLocalize();

  const hasCT = teams?.includes(CS2Team.CT);
  const hasT = teams?.includes(CS2Team.T);
  const hasAny = teams?.length === 2;

  return (
    <InventoryItemInfo
      className="flex items-center gap-1"
      label={localize("InventoryItemTeam")}
    >
      {hasCT && <img src="/icons/ct.svg" className="h-4" alt="CT" />}
      {hasT && <img src="/icons/t.svg" className="h-4" alt="T" />}
      <span>
        {hasAny
          ? localize("InventoryItemTeamAny")
          : localize(`InventoryItemTeam${hasCT ? "CT" : "T"}`)}
      </span>
    </InventoryItemInfo>
  );
}
