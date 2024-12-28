/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "react-router";
import { Authenticator } from "remix-auth";
import { getSession } from "~/session.server";
import { ApiStrategy } from "./api-strategy.server";
import { findUniqueUser } from "./models/user.server";
import { SteamStrategy } from "./steam-strategy.server";

export const authenticator = new Authenticator<string>();

authenticator.use(new SteamStrategy(), "steam").use(new ApiStrategy(), "api");

export async function getRequestUserId(request: Request) {
  const session = await getSession(request.headers.get("cookie"));
  const userId = session.get("userId") as unknown;
  if (typeof userId !== "string") {
    return undefined;
  }
  return userId;
}

export async function findRequestUser(request: Request) {
  try {
    const userId = await getRequestUserId(request);
    if (userId === undefined) {
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
