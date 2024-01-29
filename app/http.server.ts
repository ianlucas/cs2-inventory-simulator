/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { removeTrailingSlashes } from "./middlewares/remove-slashes.server";

export async function middleware(request: Request) {
  await removeTrailingSlashes(request);
}
