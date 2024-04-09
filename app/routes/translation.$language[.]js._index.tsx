/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { badRequest } from "~/response.server";

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const language = z
      .string()
      .transform((value) => value.split(".")[0].trim())
      .parse(params.language);
    return new Response(
      `window.$systemTranslation = ${JSON.stringify(global.$systemTranslations[language] ?? global.$systemTranslations.english)};
  window.$itemsTranslation = ${JSON.stringify(global.$itemsTranslations[language] ?? global.$itemsTranslations.english)};
  window.dispatchEvent(new Event("translation-loaded"));`,
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
