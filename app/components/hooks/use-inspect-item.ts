/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import type { UnboxingResult } from "~/shared/unboxing-league";

export function useInspectItem() {
  const [inspectItem, setInspectItem] = useState<{
    uid: number;
    unboxing?: UnboxingResult;
  }>();

  function handleInspectItem(uid: number, unboxing?: UnboxingResult) {
    return setInspectItem({ uid, unboxing });
  }

  function closeInspectItem() {
    return setInspectItem(undefined);
  }

  function isInspectingItem(
    state: typeof inspectItem
  ): state is NonNullable<typeof inspectItem> {
    return state !== undefined;
  }

  return {
    closeInspectItem,
    handleInspectItem,
    inspectItem,
    isInspectingItem
  };
}
