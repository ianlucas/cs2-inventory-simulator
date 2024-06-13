/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";

export function useRemoveItemPatch() {
  const [removeItemPatch, setRemoveItemPatch] = useState<{
    uid: number;
  }>();

  function handleRemoveItemPatch(uid: number) {
    return setRemoveItemPatch({ uid });
  }

  function closeRemoveItemPatch() {
    return setRemoveItemPatch(undefined);
  }

  function isRemovingItemPatch(
    state: typeof removeItemPatch
  ): state is NonNullable<typeof removeItemPatch> {
    return state !== undefined;
  }

  return {
    closeRemoveItemPatch,
    handleRemoveItemPatch,
    isRemovingItemPatch,
    removeItemPatch
  };
}
