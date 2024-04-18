/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";

export function useInspectItem() {
  const [inspectItem, setInspectItem] = useState<{
    uid: number;
  }>();

  function handleInspectItem(uid: number) {
    return setInspectItem({ uid });
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
