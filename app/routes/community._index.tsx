/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "react-router";
import { getUserIdFromRequest } from "~/auth.server";
import { Community } from "~/components/community";
import { middleware } from "~/middleware.server";
import {
  appShowCommunity,
  communityRankingIntervalHours,
  communityWeeklyBudget,
  inventoryAllowProfile
} from "~/models/rule.server";
import { getUnboxingLeague } from "~/models/unboxing-league.server";
import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/community._index";

export const meta = getMetaTitle("CommunityTitle");

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserIdFromRequest(request);
  await middleware(request, userId);
  const isEnabled =
    userId !== undefined
      ? await appShowCommunity.for(userId).get()
      : await appShowCommunity.get();
  if (!isEnabled) {
    throw redirect("/");
  }
  const now = new Date();
  const [budget, intervalHours, isProfileAllowed, league] = await Promise.all([
    communityWeeklyBudget.get(),
    communityRankingIntervalHours.get(),
    userId !== undefined ? inventoryAllowProfile.for(userId).get() : true,
    getUnboxingLeague(userId, now)
  ]);
  return {
    budget,
    intervalHours,
    isViewerPrivate: !isProfileAllowed,
    league,
    // Relative times render from the server's clock so hydration matches.
    now: now.getTime()
  };
}

export default function CommunityPage({ loaderData }: Route.ComponentProps) {
  return <Community {...loaderData} />;
}
