/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "react-router";

export async function removeTrailingSlashes(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/") && url.pathname !== "/") {
    throw redirect(url.pathname.slice(0, -1) + url.search);
  }
}
