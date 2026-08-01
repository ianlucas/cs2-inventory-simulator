/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";

export function useUnpackItem() {
  const [unpackItem, setUnpackItem] = useState<{
    uid: number;
  }>();

  function handleUnpackItem(uid: number) {
    return setUnpackItem({ uid });
  }

  function closeUnpackItem() {
    return setUnpackItem(undefined);
  }

  function isUnpackingItem(
    state: typeof unpackItem
  ): state is NonNullable<typeof unpackItem> {
    return state !== undefined;
  }

  return {
    closeUnpackItem,
    handleUnpackItem,
    isUnpackingItem,
    unpackItem
  };
}
