/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { json } from "@remix-run/node";
import { CS_InventoryItem } from "cslib";
import { prisma } from "~/db.server";
import { parseInventory } from "~/utils/user";

export async function useUserCache({
  generate,
  throwData,
  mimeType,
  url,
  userId
}: {
  generate: (inventory: CS_InventoryItem[]) => any;
  throwData: any;
  mimeType: string;
  url: string;
  userId: string;
}) {
  const user = await prisma.user.findFirst({
    select: { syncedAt: true },
    where: { id: userId }
  });
  if (user === null) {
    throw json(throwData);
  }
  const cache = await prisma.userCache.findFirst({
    select: { response: true },
    where: {
      url,
      userId,
      timestamp: user.syncedAt
    }
  });
  const inventory = (await prisma.user.findFirst({
    select: { inventory: true },
    where: { id: userId }
  }))?.inventory;
  if (!inventory) {
    throw mimeType === "application/json"
      ? json(throwData)
      : new Response(throwData, {
        headers: { "Content-Type": mimeType }
      });
  }
  if (cache !== null) {
    return new Response(cache.response, {
      headers: { "Content-Type": mimeType }
    });
  }
  const generated = generate(parseInventory(inventory));
  const response = mimeType === "application/json"
    ? JSON.stringify(generated)
    : generated;
  await prisma.userCache.upsert({
    create: {
      url,
      userId,
      response,
      timestamp: user.syncedAt
    },
    update: {
      response,
      timestamp: user.syncedAt
    },
    where: {
      url_userId: {
        url,
        userId
      }
    }
  });
  return new Response(response, {
    headers: { "Content-Type": mimeType }
  });
}
