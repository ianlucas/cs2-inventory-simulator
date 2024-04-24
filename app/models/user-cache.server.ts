/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_BaseInventoryItem } from "@ianlucas/cs2-lib";
import { json } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/db.server";
import { res } from "~/response.server";
import { parseInventory } from "~/utils/inventory";

export async function handleUserCachedResponse({
  args,
  generate,
  mimeType,
  request,
  throwBody,
  url,
  userId
}: {
  args: string | null;
  generate:
    | ((inventory: CS_BaseInventoryItem[], userId: string) => any)
    | ((inventory: CS_BaseInventoryItem[], userId: string) => Promise<any>);
  request: Request;
  throwBody: any;
  mimeType: string;
  url: string;
  userId: string;
}) {
  const user = await prisma.user.findFirst({
    select: { syncedAt: true },
    where: { id: userId }
  });
  if (user === null) {
    throw mimeType === "application/json"
      ? json(throwBody)
      : res(throwBody, mimeType);
  }
  const cache = await prisma.userCache.findFirst({
    select: { body: true },
    where: {
      args,
      url,
      userId,
      timestamp: user.syncedAt
    }
  });
  if (cache !== null) {
    return res(cache.body, mimeType);
  }
  const inventory = (
    await prisma.user.findFirst({
      select: { inventory: true },
      where: { id: userId }
    })
  )?.inventory;
  if (!inventory) {
    throw mimeType === "application/json"
      ? json(throwBody)
      : res(throwBody, mimeType);
  }
  const generated = await generate(parseInventory(inventory), userId);
  const body =
    mimeType === "application/json"
      ? JSON.stringify(generated)
      : z.string().parse(generated);
  await prisma.userCache.upsert({
    create: {
      args,
      body,
      timestamp: user.syncedAt,
      url,
      userId
    },
    update: {
      args,
      body,
      timestamp: user.syncedAt
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
