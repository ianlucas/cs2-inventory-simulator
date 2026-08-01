/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";

export function useExtractItemSticker() {
  const [extractItemSticker, setExtractItemSticker] = useState<{
    uid: number;
  }>();

  function handleExtractItemSticker(uid: number) {
    return setExtractItemSticker({ uid });
  }

  function closeExtractItemSticker() {
    return setExtractItemSticker(undefined);
  }

  function isExtractingItemSticker(
    state: typeof extractItemSticker
  ): state is NonNullable<typeof extractItemSticker> {
    return state !== undefined;
  }

  return {
    closeExtractItemSticker,
    extractItemSticker,
    handleExtractItemSticker,
    isExtractingItemSticker
  };
}
