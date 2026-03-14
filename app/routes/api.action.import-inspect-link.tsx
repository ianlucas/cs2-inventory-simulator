/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import {
  isSteamInspectLink,
  parseCSFloatItemInfo,
  parseInspectLink
} from "@ianlucas/cs2-lib-inspect";
import z from "zod";
import { api } from "~/api.server";
import { getRequestUserId } from "~/auth.server";
import { fetchCSFloatItemInfo } from "~/csfloat.server";
import { middleware } from "~/http.server";
import {
  badRequest,
  methodNotAllowed,
  tooManyRequests
} from "~/responses.server";
import { isValidInspectLink } from "~/utils/economy";
import type { Route } from "./+types/api.action.import-inspect-link";

// Grows larger as application lives, something to look out.
const lastRequestByUser = new Map<string, number>();

export const action = api(async ({ request }: Route.ActionArgs) => {
  await middleware(request);
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }
  const userId = await getRequestUserId(request);
  if (!userId) {
    throw badRequest;
  }
  if (Date.now() - (lastRequestByUser.get(userId) ?? 0) < 1000) {
    throw tooManyRequests;
  }
  lastRequestByUser.set(userId, Date.now());
  const { inspectLink } = z
    .object({
      inspectLink: z.string().refine((value) => isValidInspectLink(value))
    })
    .parse(await request.json());
  if (isSteamInspectLink(inspectLink)) {
    return parseCSFloatItemInfo(
      CS2Economy,
      (await fetchCSFloatItemInfo(inspectLink)).iteminfo
    );
  }
  try {
    return parseInspectLink(CS2Economy, inspectLink);
  } catch {
    throw badRequest;
  }
});

export { loader } from "./api.$";
