/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Team, CS2TeamValues } from "@ianlucas/cs2-lib";
import { useTranslate } from "./app-context";
import { InventoryItemTooltipInfo } from "./inventory-item-tooltip-info";

export function InventoryItemTooltipTeams({
  teams
}: {
  teams?: CS2TeamValues[];
}) {
  const translate = useTranslate();

  const hasCT = teams?.includes(CS2Team.CT);
  const hasT = teams?.includes(CS2Team.T);
  const hasAny = teams?.length === 2;

  return (
    <InventoryItemTooltipInfo
      className="flex items-center gap-1"
      label={translate("InventoryItemTeam")}
    >
      {hasCT && <img src="/images/vectors/ct.svg" className="h-4" alt="CT" />}
      {hasT && <img src="/images/vectors/t.svg" className="h-4" alt="T" />}
      <span>
        {hasAny
          ? translate("InventoryItemTeamAny")
          : translate(`InventoryItemTeam${hasCT ? "CT" : "T"}`)}
      </span>
    </InventoryItemTooltipInfo>
  );
}
