/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { MiddlewareHandler } from "hono";
import { isValidLanguage } from "~/data/languages";
import { loadItemTranslationMap } from "~/item-translation-file.server";
import { parseTranslationFileName } from "~/translation-files";
import * as uiTranslations from "~/translations";

// File names carry a content hash, so a served file never changes.
export const cacheTranslationFiles: MiddlewareHandler = async (c, next) => {
  await next();
  if (c.res.ok) {
    c.res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }
};

// Dev has no built files, so they're rendered from the live modules on every
// request, ignoring the hash, and translation edits show up on reload.
export const serveTranslationFilesInDev: MiddlewareHandler = async (
  c,
  next
) => {
  const file = parseTranslationFileName(
    c.req.path.slice("/translations/".length)
  );
  if (file === undefined || !isValidLanguage(file.language)) {
    return next();
  }
  return c.json(
    file.kind === "ui"
      ? uiTranslations[file.language]
      : await loadItemTranslationMap(file.language),
    200,
    { "Cache-Control": "no-store" }
  );
};
