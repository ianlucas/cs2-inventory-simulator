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
import { middleware } from "~/http.server";
import {
  getUserPreference,
  setUserPreference
} from "~/models/user-preferences.server";
import { getAllowedBackgrounds } from "~/preferences/background.server";
import { getAllowedLanguages } from "~/preferences/language.server";
import { assignToSession, commitSession, getSession } from "~/session.server";

export const ApiActionPreferencesUrl = "/api/action/preferences";

export async function loader({ request }: LoaderFunctionArgs) {
  await middleware(request);
  const userId = await authenticator.isAuthenticated(request);
  if (!userId) {
    return redirect("/");
  }
  const session = await getSession(request.headers.get("Cookie"));
  assignToSession(session, {
    background: await getUserPreference(userId, "background"),
    hideFreeItems: await getUserPreference(userId, "hideFreeItems"),
    language: await getUserPreference(userId, "language"),
    statsForNerds: await getUserPreference(userId, "statsForNerds")
  });
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session)
    }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  await middleware(request);
  const userId = await authenticator.isAuthenticated(request);
  const { background, language, statsForNerds, hideFreeItems } = z
    .object({
      background: z
        .string()
        .refine(
          (background) =>
            background === "" || getAllowedBackgrounds().includes(background)
        )
        .transform((background) => (background === "" ? null : background)),
      language: z
        .string()
        .refine((language) => getAllowedLanguages().includes(language)),
      statsForNerds: z
        .literal("true")
        .or(z.literal("false"))
        .transform((value) => String(value === "true")),
      hideFreeItems: z
        .literal("true")
        .or(z.literal("false"))
        .transform((value) => String(value === "true"))
    })
    .parse(Object.fromEntries(await request.formData()));
  if (userId) {
    await setUserPreference(userId, "background", background);
    await setUserPreference(userId, "hideFreeItems", hideFreeItems);
    await setUserPreference(userId, "language", language);
    await setUserPreference(userId, "statsForNerds", statsForNerds);
  }
  const session = await getSession(request.headers.get("Cookie"));
  assignToSession(session, {
    background,
    hideFreeItems,
    language,
    statsForNerds
  });
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": await commitSession(session)
    }
  });
}
