/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "react-router";

export async function removeTrailingDots(request: Request) {
  const url = new URL(request.url);
  if (url.hostname.endsWith(".")) {
    url.hostname = url.hostname.slice(0, -1);
    throw redirect(url.toString());
  }
}
