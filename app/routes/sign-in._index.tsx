/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "react-router";
import { authenticator } from "~/auth.server";
import { middleware } from "~/http.server";
import type { Route } from "./+types/sign-in._index";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    await middleware(request);
    return authenticator.authenticate("steam", request);
  } catch (error) {
    if (!(error instanceof Response)) {
      console.error(error);
      throw redirect("/?error=FailedToAuth");
    }
    throw error;
  }
}
