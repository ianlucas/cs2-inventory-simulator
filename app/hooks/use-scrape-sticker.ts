/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";

export function useScrapeSticker() {
  const [scrapeSticker, setScrapeSticker] = useState<{
    index: number;
  }>();

  function handleScrapeSticker(index: number) {
    return setScrapeSticker({ index });
  }

  function closeScrapeSticker() {
    return setScrapeSticker(undefined);
  }

  return {
    closeScrapeSticker,
    handleScrapeSticker,
    scrapeSticker
  };
}
