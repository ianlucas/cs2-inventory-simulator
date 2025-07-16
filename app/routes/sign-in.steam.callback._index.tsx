/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "react-router";
import { authenticator } from "~/auth.server";
import { middleware } from "~/http.server";
import { commitSession, getSession } from "~/session.server";
import type { Route } from "./+types/sign-in.steam.callback._index";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    await middleware(request);
    const userId = await authenticator.authenticate("steam", request);
    const session = await getSession(request.headers.get("cookie"));
    session.set("userId", userId);
    throw redirect("/api/action/preferences", {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    });
  } catch (error) {
    if (!(error instanceof Response)) {
      console.error(error);
      throw redirect("/?error=FailedToValidate");
    }
    throw error;
  }
}

export { ErrorBoundary as default } from "~/components/error-boundary";
