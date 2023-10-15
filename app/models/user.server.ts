import { CS_InventoryItem } from "cslib";
import SteamAPI from "steamapi";
import { prisma } from "~/db.server";

export async function upsertUser(user: SteamAPI.PlayerSummary) {
  const data = {
    avatar: user.avatar.medium,
    name: user.nickname
  };
  return (await prisma.user.upsert({
    select: {
      id: true
    },
    create: {
      id: user.steamID,
      ...data
    },
    update: {
      ...data
    },
    where: {
      id: user.steamID
    }
  })).id;
}

export async function findUniqueUser(userId: string) {
  return await prisma.user.findUniqueOrThrow({
    where: { id: userId }
  });
}

export async function updateUserInventory(
  userId: string,
  inventory: CS_InventoryItem[]
) {
  return await prisma.user.update({
    data: { inventory: JSON.stringify(inventory) },
    where: { id: userId }
  });
}
