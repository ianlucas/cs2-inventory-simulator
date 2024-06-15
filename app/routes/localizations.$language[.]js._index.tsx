/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { LOCALIZATION_LOADED_TYPE } from "~/components/hooks/use-localization";
import { middleware } from "~/http.server";
import { badRequest } from "~/responses.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  middleware(request);
  try {
    const language = z
      .string()
      .transform((value) => value.split(".")[0].trim())
      .parse(params.language);
    return new Response(
      `window.__systemLocalizationMap = ${JSON.stringify(global.__systemLocalizationByLanguage[language] ?? global.__systemLocalizationByLanguage.english)};
  window.__itemLocalizationMap = ${JSON.stringify(global.__itemLocalizationByLanguage[language] ?? global.__itemLocalizationByLanguage.english)};
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
