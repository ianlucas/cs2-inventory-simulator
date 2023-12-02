/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect
} from "@remix-run/node";
import { z } from "zod";
import { authenticator } from "~/auth.server";
import {
  getUserLanguagePreference,
  setUserLanguagePreference
} from "~/models/user-preferences.server";
import { getAllowedLanguages, setUserLanguage } from "~/translations.server";

export const ApiActionPreferencesUrl = "/api/action/preferences";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await authenticator.isAuthenticated(request);
  if (!userId) {
    return redirect("/");
  }
  const language = await getUserLanguagePreference(userId);
  return redirect("/", {
    headers: {
      ...(await setUserLanguage(request, language))
    }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await authenticator.isAuthenticated(request);
  const { language } = z
    .object({
      language: z
        .string()
        .refine((language) => getAllowedLanguages().includes(language))
    })
    .parse(Object.fromEntries(await request.formData()));
  if (userId) {
    await setUserLanguagePreference(userId, language);
  }
  return new Response(null, {
    status: 204,
    headers: {
      ...(await setUserLanguage(request, language))
    }
  });
}
