/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { z } from "zod";
import { serverGlobals } from "~/globals";
import { middleware } from "~/middleware.server";
import type { Route } from "./+types/translations.$language[.]json._index";

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
    return Response.json(
      { systemTranslationMap, itemTranslationMap },
      {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable"
        }
      }
    );
  } catch {
    return new Response(null, {
      status: 400,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store"
      }
    });
  }
}
