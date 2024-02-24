/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "@remix-run/node";
import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/session.server";
import { ApiStrategy } from "./auth-strategy-api.server";
import { SteamStrategy } from "./auth-strategy-steam.server";
import { findUniqueUser } from "./models/user.server";

export const authenticator = new Authenticator<string>(sessionStorage);

authenticator.use(new SteamStrategy(), "steam").use(new ApiStrategy(), "api");

export async function findRequestUser(request: Request) {
  const userId = await authenticator.isAuthenticated(request);
  if (userId === null) {
    return undefined;
  }
  try {
    return await findUniqueUser(userId);
  } catch {
    throw redirect("/sign-out");
  }
}

export async function requireUser(request: Request) {
  const user = await findRequestUser(request);
  if (user === undefined) {
    throw redirect("/sign-in");
  }
  return user;
}
