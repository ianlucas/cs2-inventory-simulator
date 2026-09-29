/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getUserIdFromRequest } from "./auth.server";
import { removeTrailingDots } from "./middlewares/remove-trailing-dots.server";
import { removeTrailingSlashes } from "./middlewares/remove-trailing-slashes.server";
import { touchLastSeen } from "./models/user.server";
import { setMonitoringUser } from "./monitoring.server";

export async function middleware(request: Request, userId?: string) {
  userId ??= await getUserIdFromRequest(request);
  await removeTrailingDots(request);
  await removeTrailingSlashes(request);
  if (userId !== undefined) {
    setMonitoringUser(userId);
    await touchLastSeen(userId);
  }
}
