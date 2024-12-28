/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "react-router";
import { api } from "~/api.server";
import { authenticator } from "~/auth.server";
import { middleware } from "~/http.server";
import { commitSession, getSession } from "~/session.server";
import type { Route } from "./+types/api.sign-in.callback._index";

export const loader = api(async ({ request }: Route.LoaderArgs) => {
  try {
    await middleware(request);
    const userId = await authenticator.authenticate("api", request);
    const session = await getSession(request.headers.get("cookie"));
    session.set("userId", userId);
    return redirect("/api/action/preferences", {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw redirect("/");
    }
    throw error;
  }
});
