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
