/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";

export function useScrapeItemSticker() {
  const [scrapeItemSticker, setScrapeItemSticker] = useState<{
    index: number;
  }>();

  function handleScrapeItemSticker(index: number) {
    return setScrapeItemSticker({ index });
  }

  function closeScrapeItemSticker() {
    return setScrapeItemSticker(undefined);
  }

  return {
    closeScrapeItemSticker,
    handleScrapeItemSticker,
    scrapeItemSticker
  };
}
