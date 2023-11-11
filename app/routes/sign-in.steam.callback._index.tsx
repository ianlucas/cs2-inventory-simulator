/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/auth.server";

export function loader({ request }: LoaderFunctionArgs) {
  return authenticator.authenticate("steam", request, {
    successRedirect: "/api/action/preferences",
    failureRedirect: "/"
  });
}
