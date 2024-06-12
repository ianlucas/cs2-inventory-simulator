/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { api } from "~/api.server";
import { authenticator } from "~/auth.server";
import { middleware } from "~/http.server";

export const loader = api(async ({ request }: LoaderFunctionArgs) => {
  await middleware(request);
  return authenticator.authenticate("api", request, {
    successRedirect: "/api/action/preferences",
    failureRedirect: "/"
  });
});
