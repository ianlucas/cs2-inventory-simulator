/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_TEAM_CT, CS_TEAM_T, CS_Team } from "@ianlucas/cs2-lib";
import { useTranslate } from "./app-context";
import { InventoryItemInfo } from "./inventory-item-info";

export function InventoryItemTeams({ teams }: { teams?: CS_Team[] }) {
  const translate = useTranslate();

  const hasCT = teams?.includes(CS_TEAM_CT);
  const hasT = teams?.includes(CS_TEAM_T);
  const hasAny = teams?.length === 2;

  return (
    <InventoryItemInfo
      className="flex items-center gap-1"
      label={translate("InventoryItemTeam")}
    >
      {hasCT && <img src="/icons/ct.svg" className="h-5" alt="CT" />}
      {hasT && <img src="/icons/t.svg" className="h-5" alt="T" />}
      <span>
        {hasAny
          ? translate("InventoryItemTeamAny")
          : translate(`InventoryItemTeam${hasCT ? "CT" : "T"}`)}
      </span>
    </InventoryItemInfo>
  );
}
