/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_KEYCHAIN_OFFSET_FACTOR,
  CS2_STICKER_OFFSET_FACTOR,
  CS2BaseInventoryItem,
  CS2Economy,
  truncateToFactor
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

function postParseInventoryItem(item: CS2BaseInventoryItem) {
  if (item.keychains !== undefined) {
    for (const keychain of Object.values(item.keychains)) {
      if (keychain.x !== undefined) {
        keychain.x = truncateToFactor(keychain.x, CS2_KEYCHAIN_OFFSET_FACTOR);
      }
      if (keychain.y !== undefined) {
        keychain.y = truncateToFactor(keychain.y, CS2_KEYCHAIN_OFFSET_FACTOR);
      }
      if (keychain.z !== undefined) {
        keychain.z = truncateToFactor(keychain.z, CS2_KEYCHAIN_OFFSET_FACTOR);
      }
    }
  }
  if (item.stickers !== undefined) {
    for (const sticker of Object.values(item.stickers)) {
      if (sticker.x !== undefined) {
        sticker.x = truncateToFactor(sticker.x, CS2_STICKER_OFFSET_FACTOR);
      }
      if (sticker.y !== undefined) {
        sticker.y = truncateToFactor(sticker.y, CS2_STICKER_OFFSET_FACTOR);
      }
    }
  }
  return item;
}

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
    item = postParseInventoryItem(
      parseCSFloatItemInfo(CS2Economy, await fetchCSFloatItemInfo(inspectLink))
    );
  } else {
    try {
      item = postParseInventoryItem(parseInspectLink(CS2Economy, inspectLink));
    } catch {
      throw badRequest;
    }
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
