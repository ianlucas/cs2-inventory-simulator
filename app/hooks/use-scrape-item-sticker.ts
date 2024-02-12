/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";

export function useScrapeItemSticker() {
  const [scrapeItemSticker, setScrapeItemSticker] = useState<{
    uid: number;
  }>();

  function handleScrapeItemSticker(uid: number) {
    return setScrapeItemSticker({ uid });
  }

  function closeScrapeItemSticker() {
    return setScrapeItemSticker(undefined);
  }

  function isScrapingItemSticker(
    state: typeof scrapeItemSticker
  ): state is NonNullable<typeof scrapeItemSticker> {
    return state !== undefined;
  }

  return {
    closeScrapeItemSticker,
    handleScrapeItemSticker,
    isScrapingItemSticker,
    scrapeItemSticker
  };
}
