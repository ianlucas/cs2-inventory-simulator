/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "@remix-run/node";
import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/session.server";
import { ApiStrategy } from "./api-strategy.server";
import { findUniqueUser } from "./models/user.server";
import { SteamStrategy } from "./steam-strategy.server";

export const authenticator = new Authenticator<string>(sessionStorage);

authenticator.use(new SteamStrategy(), "steam").use(new ApiStrategy(), "api");

export async function findRequestUser(request: Request) {
  try {
    const userId = await authenticator.isAuthenticated(request);
    if (userId === null) {
      return undefined;
    }
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
