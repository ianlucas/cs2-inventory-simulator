/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory } from "@ianlucas/cs2-lib";
import { z } from "zod";
import { prisma } from "~/db.server";
import { res } from "~/responses.server";
import { safeLoadInventory } from "~/utils/inventory";
import {
  getUserInventory,
  getUserInventoryOptions,
  getUserSyncedAt
} from "./user.server";

export async function handleUserCachedResponse({
  args,
  generate,
  throwBody,
  url,
  userId
}: {
  args: string | null;
  generate:
    | ((inventory: CS2Inventory, userId: string) => unknown)
    | ((inventory: CS2Inventory, userId: string) => Promise<unknown>);
  throwBody: object | string;
  url: string;
  userId: string;
}) {
  const mimeType =
    typeof throwBody === "string" ? "text/html" : "application/json";
  const user = await prisma.user.findFirst({
    select: { id: true },
    where: { id: userId }
  });
  if (user === null) {
    throw typeof throwBody === "string"
      ? res(throwBody, mimeType)
      : Response.json(throwBody);
  }
  const userSyncedAt = await getUserSyncedAt(userId);
  const cache = await prisma.userApiResponseCache.findFirst({
    select: { body: true },
    where: {
      args,
      userSyncedAt,
      url,
      userId
    }
  });
  if (cache !== null) {
    return res(cache.body, mimeType);
  }
  const inventory = safeLoadInventory(
    await getUserInventory(userId),
    await getUserInventoryOptions(userId)
  );
  if (inventory === undefined) {
    throw typeof throwBody === "string"
      ? res(throwBody, mimeType)
      : Response.json(throwBody);
  }
  const generated = await generate(inventory, userId);
  const body =
    mimeType === "application/json"
      ? JSON.stringify(generated)
      : z.string().parse(generated);
  await prisma.userApiResponseCache.upsert({
    create: {
      args,
      body,
      userSyncedAt,
      url,
      userId
    },
    update: {
      args,
      body,
      userSyncedAt
    },
    where: {
      url_userId: {
        url,
        userId
      }
    }
  });
  return res(body, mimeType);
}
