/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useState } from "react";
import { ItemImage } from "./item-image";

export function UnlockCaseContainerBackground({
  canUnlock,
  caseItem
}: {
  canUnlock: boolean;
  caseItem: CS2EconomyItem;
}) {
  const [scale, setScale] = useState(0);

  function handleLoad() {
    setScale(window.innerWidth >= 768 ? 2 : 1);
  }

  return (
    <div
      className={clsx(
        "fixed top-0 left-0 flex h-full w-full items-center justify-center transition-all",
        !canUnlock && "blur-xs",
        canUnlock && "blur-[1px]"
      )}
      style={{
        transform: `scale(${scale})`
      }}
    >
      <ItemImage className="w-[256px]" item={caseItem} onLoad={handleLoad} />
    </div>
  );
}
