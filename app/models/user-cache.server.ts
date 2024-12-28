/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryData } from "@ianlucas/cs2-lib";
import { z } from "zod";
import { prisma } from "~/db.server";
import { res } from "~/responses.server";
import { parseInventory } from "~/utils/inventory";
import { getUserInventory, getUserSyncedAt } from "./user.server";

export async function handleUserCachedResponse({
  args,
  generate,
  mimeType,
  throwBody,
  url,
  userId
}: {
  args: string | null;
  generate:
    | ((inventory: CS2InventoryData, userId: string) => any)
    | ((inventory: CS2InventoryData, userId: string) => Promise<any>);
  throwBody: any;
  mimeType: string;
  url: string;
  userId: string;
}) {
  const user = await prisma.user.findFirst({
    select: { id: true },
    where: { id: userId }
  });
  if (user === null) {
    throw mimeType === "application/json"
      ? Response.json(throwBody)
      : res(throwBody, mimeType);
  }
  const timestamp = await getUserSyncedAt(userId);
  const cache = await prisma.userCache.findFirst({
    select: { body: true },
    where: {
      args,
      url,
      userId,
      timestamp
    }
  });
  if (cache !== null) {
    return res(cache.body, mimeType);
  }
  const inventory = parseInventory(await getUserInventory(userId));
  if (!inventory) {
    throw mimeType === "application/json"
      ? Response.json(throwBody)
      : res(throwBody, mimeType);
  }
  const generated = await generate(inventory, userId);
  const body =
    mimeType === "application/json"
      ? JSON.stringify(generated)
      : z.string().parse(generated);
  await prisma.userCache.upsert({
    create: {
      args,
      body,
      timestamp,
      url,
      userId
    },
    update: {
      args,
      body,
      timestamp
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
