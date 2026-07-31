/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2Economy,
  repairInventoryItem
} from "@ianlucas/cs2-lib";
import {
  isSteamInspectLink,
  parseCSFloatItemInfo,
  parseInspectLink
} from "@ianlucas/cs2-lib-inspect";
import z from "zod";
import { api } from "~/api.server";
import { getUserIdFromRequest } from "~/auth.server";
import { usePostFetcher } from "~/components/hooks/use-post-fetcher";
import { fetchCSFloatItemInfo } from "~/csfloat.server";
import { middleware } from "~/middleware.server";
import {
  craftAllowImportInspectLink,
  inventoryItemMaxPatches,
  inventoryItemMaxStickers
} from "~/models/rule.server";
import {
  badRequest,
  forbidden,
  methodNotAllowed,
  tooManyRequests
} from "~/responses.server";
import { isValidInspectLink } from "~/utils/economy";
import { RateLimiter } from "~/utils/rate-limiter.server";
import type { Route } from "./+types/api.action.import-inspect-link";

const rateLimiter = new RateLimiter(1000);

async function enforceMaxAttachments(
  item: CS2BaseInventoryItem,
  userId: string
) {
  if (
    Object.keys(item.patches ?? {}).length >
      (await inventoryItemMaxPatches.for(userId).get()) ||
    Object.keys(item.stickers ?? {}).length >
      (await inventoryItemMaxStickers.for(userId).get())
  ) {
    throw forbidden;
  }
}

export const action = api(async ({ request }: Route.ActionArgs) => {
  await middleware(request);
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    throw badRequest;
  }
  if (!(await craftAllowImportInspectLink.for(userId).get())) {
    throw badRequest;
  }
  if (rateLimiter.isLimited(userId)) {
    throw tooManyRequests;
  }
  rateLimiter.consume(userId);
  const { inspectLink } = z
    .object({
      inspectLink: z.string().refine((value) => isValidInspectLink(value))
    })
    .parse(await request.json());
  let item: CS2BaseInventoryItem;
  if (isSteamInspectLink(inspectLink)) {
    item = parseCSFloatItemInfo(
      CS2Economy,
      await fetchCSFloatItemInfo(inspectLink)
    );
  } else {
    try {
      item = parseInspectLink(CS2Economy, inspectLink);
    } catch {
      throw badRequest;
    }
  }
  if (!repairInventoryItem(CS2Economy, item)) {
    throw badRequest;
  }
  await enforceMaxAttachments(item, userId);
  return item;
});

export { loader } from "./api.$";

export function useImportInspectLinkFetcher() {
  const fetcher = usePostFetcher<CS2BaseInventoryItem>(
    "/api/action/import-inspect-link"
  );
  return {
    ...fetcher,
    submit: (inspectLink: string) => fetcher.submit({ inspectLink })
  };
}
