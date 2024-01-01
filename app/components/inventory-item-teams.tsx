/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item, CS_TEAM_CT, CS_TEAM_T } from "@ianlucas/cslib";
import { useTranslation } from "~/hooks/use-translation";

export function InventoryItemTeams({ item: { teams } }: { item: CS_Item }) {
  const translate = useTranslation();

  const hasCT = teams?.includes(CS_TEAM_CT);
  const hasT = teams?.includes(CS_TEAM_T);
  const hasAny = teams?.length === 2;

  return (
    <div className="my-2 flex items-center gap-4 border-b border-t border-neutral-700/70 py-1">
      <span className="font-bold text-neutral-400">
        {translate("InventoryItemTeam")}
      </span>
      <div className="flex items-center gap-1">
        {hasCT && <img src="/icons/ct.svg" className="h-5" alt="CT" />}
        {hasT && <img src="/icons/t.svg" className="h-5" alt="T" />}
        <span>
          {hasAny
            ? translate("InventoryItemTeamAny")
            : translate(`InventoryItemTeam${hasCT ? "CT" : "T"}`)}
        </span>
      </div>
    </div>
  );
}
