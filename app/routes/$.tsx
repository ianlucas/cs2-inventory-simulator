/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { middleware } from "~/http.server";

export function loader({ request }: LoaderFunctionArgs) {
  middleware(request);
  return redirect("/");
}
