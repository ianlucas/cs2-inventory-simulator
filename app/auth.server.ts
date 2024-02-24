/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "@remix-run/node";
import { Authenticator } from "remix-auth";
import { SteamStrategy } from "remix-auth-steam";
import { sessionStorage } from "~/session.server";
import { STEAM_API_KEY, STEAM_CALLBACK_URL } from "./env.server";
import { findUniqueUser, upsertUser } from "./models/user.server";
import { ApiStrategy } from "./auth-strategy-api.server";

export const authenticator = new Authenticator<string>(sessionStorage);

authenticator
  .use(
    new SteamStrategy(
      {
        returnURL: STEAM_CALLBACK_URL,
        apiKey: STEAM_API_KEY
      },
      async (user) => await upsertUser(user)
    ),
    "steam"
  )
  .use(new ApiStrategy(), "api");

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
