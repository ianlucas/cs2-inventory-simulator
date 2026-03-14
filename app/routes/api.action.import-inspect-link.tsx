/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import {
  isSteamInspectLink,
  parseInspectLink
} from "@ianlucas/cs2-lib-inspect";
import z from "zod";
import { api } from "~/api.server";
import { getRequestUserId } from "~/auth.server";
import { fetchCSFloatItemInfo } from "~/csfloat.server";
import { middleware } from "~/http.server";
import { badRequest, methodNotAllowed } from "~/responses.server";
import { isValidInspectLink } from "~/utils/economy";
import type { Route } from "./+types/api.action.import-inspect-link";

export const action = api(async ({ request }: Route.ActionArgs) => {
  await middleware(request);
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }
  if (!(await getRequestUserId(request))) {
    throw badRequest;
  }
  const { inspectLink } = z
    .object({
      inspectLink: z.string().refine((value) => isValidInspectLink(value))
    })
    .parse(await request.json());
  if (isSteamInspectLink(inspectLink)) {
    return await fetchCSFloatItemInfo(inspectLink);
  }
  try {
    return parseInspectLink(CS2Economy, inspectLink);
  } catch {
    throw badRequest;
  }
});

export { loader } from "./api.$";
