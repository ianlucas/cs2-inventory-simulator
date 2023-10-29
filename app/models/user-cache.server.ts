import { json } from "@remix-run/node";
import { CS_InventoryItem } from "cslib";
import { prisma } from "~/db.server";
import { parseInventory } from "~/utils/user";

export async function useUserCache({
  url,
  userId,
  throwData,
  generate
}: {
  url: string;
  userId: string;
  throwData: any;
  generate: (inventory: CS_InventoryItem[]) => any;
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
    throw json(throwData);
  }
  if (cache !== null) {
    return new Response(cache.response, {
      headers: { "Content-Type": "application/json" }
    });
  }
  const response = JSON.stringify(generate(parseInventory(inventory)));
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
    headers: { "Content-Type": "application/json" }
  });
}
