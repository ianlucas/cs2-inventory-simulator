/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { LOCALIZATION_LOADED_TYPE } from "~/components/hooks/use-localization";
import { serverGlobals } from "~/globals";
import { middleware } from "~/http.server";
import { badRequest } from "~/responses.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  middleware(request);
  try {
    const language = z
      .string()
      .transform((value) => value.split(".")[0].trim())
      .parse(params.language);
    const systemLocalizationMap =
      serverGlobals.systemLocalizationByLanguage[language] ??
      serverGlobals.systemLocalizationByLanguage.english;
    const itemLocalizationMap =
      serverGlobals.itemLocalizationByLanguage[language] ??
      serverGlobals.itemLocalizationByLanguage.english;
    return new Response(
      `window.InventorySimulator ??= {};
  window.InventorySimulator.systemLocalizationMap = ${JSON.stringify(systemLocalizationMap)};
  window.InventorySimulator.itemLocalizationMap = ${JSON.stringify(itemLocalizationMap)};
  window.dispatchEvent(new Event("${LOCALIZATION_LOADED_TYPE}"));`,
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
