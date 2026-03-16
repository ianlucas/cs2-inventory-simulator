/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2BaseInventoryItem, CS2Economy } from "@ianlucas/cs2-lib";
import {
  isSteamInspectLink,
  parseCSFloatItemInfo,
  parseInspectLink
} from "@ianlucas/cs2-lib-inspect";
import z from "zod";
import { api } from "~/api.server";
import { getRequestUserId } from "~/auth.server";
import { usePostFetcher } from "~/components/hooks/use-post-fetcher";
import { fetchCSFloatItemInfo } from "~/csfloat.server";
import { middleware } from "~/http.server";
import { craftAllowImportInspectLink } from "~/models/rule.server";
import {
  badRequest,
  methodNotAllowed,
  tooManyRequests
} from "~/responses.server";
import { isValidInspectLink, stickerOffsetFactor } from "~/utils/economy";
import { truncate } from "~/utils/number";
import { RateLimiter } from "~/utils/rate-limiter.server";
import type { Route } from "./+types/api.action.import-inspect-link";

const rateLimiter = new RateLimiter(1000);

function postParseInventoryItem(item: CS2BaseInventoryItem) {
  if (item.keychains !== undefined) {
    for (const keychain of Object.values(item.keychains)) {
      if (keychain.x !== undefined) {
        keychain.x = truncate(keychain.x, stickerOffsetFactor);
      }
      if (keychain.y !== undefined) {
        keychain.y = truncate(keychain.y, stickerOffsetFactor);
      }
    }
  }
  if (item.stickers !== undefined) {
    for (const sticker of Object.values(item.stickers)) {
      if (sticker.x !== undefined) {
        sticker.x = truncate(sticker.x, stickerOffsetFactor);
      }
      if (sticker.y !== undefined) {
        sticker.y = truncate(sticker.y, stickerOffsetFactor);
      }
    }
  }
  return item;
}

export const action = api(async ({ request }: Route.ActionArgs) => {
  await middleware(request);
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }
  const userId = await getRequestUserId(request);
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
  if (isSteamInspectLink(inspectLink)) {
    return postParseInventoryItem(
      parseCSFloatItemInfo(CS2Economy, await fetchCSFloatItemInfo(inspectLink))
    );
  }
  try {
    return postParseInventoryItem(parseInspectLink(CS2Economy, inspectLink));
  } catch {
    throw badRequest;
  }
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
