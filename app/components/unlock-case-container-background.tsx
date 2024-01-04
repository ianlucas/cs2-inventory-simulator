/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cslib";
import clsx from "clsx";
import { CSItemImage } from "./cs-item-image";

export function UnlockCaseContainerBackground({
  canUnlock,
  caseItem
}: {
  canUnlock: boolean;
  caseItem: CS_Item;
}) {
  return (
    <div
      className={clsx(
        "fixed left-0 top-0 flex h-full w-full scale-[1] items-center justify-center transition-all md:scale-[2]",
        !canUnlock && "blur-sm",
        canUnlock && "blur-[1px]"
      )}
    >
      <CSItemImage className="h-[198px] w-[256px]" item={caseItem} />
    </div>
  );
}
