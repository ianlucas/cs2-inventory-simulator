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
import { api } from "~/api.server";
import { authenticator } from "~/auth.server";
import { middleware } from "~/http.server";
import {
  getUserPreferences,
  setUserPreferences
} from "~/models/user-preferences.server";
import {
  isValidBackground,
  transformBackground
} from "~/preferences/background.server";
import { isValidLanguage } from "~/preferences/language.server";
import { methodNotAllowed } from "~/responses.server";
import { assignToSession, commitSession, getSession } from "~/session.server";

export const ApiActionPreferencesUrl = "/api/action/preferences";

export const loader = api(async ({ request }: LoaderFunctionArgs) => {
  await middleware(request);
  const userId = await authenticator.isAuthenticated(request);
  if (!userId) {
    return redirect("/");
  }
  const session = await getSession(request.headers.get("Cookie"));
  assignToSession(
    session,
    await getUserPreferences(userId, [
      "background",
      "hideFilters",
      "hideFreeItems",
      "language",
      "statsForNerds"
    ])
  );
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session)
    }
  });
});

export const action = api(async ({ request }: ActionFunctionArgs) => {
  await middleware(request);
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }
  const userId = await authenticator.isAuthenticated(request);
  const preferences = z
    .object({
      background: z
        .string()
        .refine(isValidBackground)
        .transform(transformBackground),
      language: z.string().refine(isValidLanguage),
      statsForNerds: z.literal("true").or(z.literal("false")),
      hideFreeItems: z.literal("true").or(z.literal("false")),
      hideFilters: z.literal("true").or(z.literal("false"))
    })
    .parse(Object.fromEntries(await request.formData()));
  if (userId) {
    await setUserPreferences(userId, preferences);
  }
  const session = await getSession(request.headers.get("Cookie"));
  assignToSession(session, preferences);
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session)
    }
  });
});
