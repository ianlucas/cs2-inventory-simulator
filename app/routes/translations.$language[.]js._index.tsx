/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { z } from "zod";
import { TRANSLATION_LOADED_TYPE } from "~/components/hooks/use-translation";
import { serverGlobals } from "~/globals";
import { middleware } from "~/http.server";
import { badRequest } from "~/responses.server";
import type { Route } from "./+types/translations.$language[.]js._index";

export async function loader({ request, params }: Route.LoaderArgs) {
  await middleware(request);
  try {
    const language = z
      .string()
      .transform((value) => value.split(".")[0].trim())
      .parse(params.language);
    const systemTranslationMap =
      serverGlobals.systemTranslationByLanguage[language] ??
      serverGlobals.systemTranslationByLanguage.english;
    const itemTranslationMap =
      serverGlobals.itemTranslationByLanguage[language] ??
      serverGlobals.itemTranslationByLanguage.english;
    return new Response(
      `window.InventorySimulator ??= {};
  window.InventorySimulator.systemTranslationMap = ${JSON.stringify(systemTranslationMap)};
  window.InventorySimulator.itemTranslationMap = ${JSON.stringify(itemTranslationMap)};
  window.dispatchEvent(new Event("${TRANSLATION_LOADED_TYPE}"));`,
      {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=31536000, immutable"
        }
      }
    );
  } catch {
    return badRequest;
  }
}
