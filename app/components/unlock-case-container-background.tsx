/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cs2-lib";
import { useWindowSize } from "@uidotdev/usehooks";
import clsx from "clsx";
import { useState } from "react";
import { CSItemImage } from "./cs-item-image";

export function UnlockCaseContainerBackground({
  canUnlock,
  caseItem
}: {
  canUnlock: boolean;
  caseItem: CS_Item;
}) {
  const { width } = useWindowSize();
  const [scale, setScale] = useState(0);

  function handleLoad() {
    if (width === null) {
      return;
    }
    setScale(width >= 768 ? 2 : 1);
  }

  return (
    <div
      className={clsx(
        "fixed left-0 top-0 flex h-full w-full items-center justify-center transition-all",
        !canUnlock && "blur-sm",
        canUnlock && "blur-[1px]"
      )}
      style={{
        transform: `scale(${scale})`
      }}
    >
      <CSItemImage
        className="h-[198px] w-[256px]"
        item={caseItem}
        onLoad={handleLoad}
      />
    </div>
  );
}
