/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "react-router";
import { api } from "~/api.server";
import { authenticator } from "~/auth.server";
import { middleware } from "~/http.server";
import type { Route } from "./+types/api.sign-in.callback._index";

export const loader = api(async ({ request }: Route.LoaderArgs) => {
  try {
    await middleware(request);
    const userId = authenticator.authenticate("api", request);
    const session = await sessionStorage.getSession(
      request.headers.get("cookie")
    );
    session.set("userId", userId);
    throw redirect("/api/action/preferences", {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session)
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      redirect("/");
    }
  }
});
