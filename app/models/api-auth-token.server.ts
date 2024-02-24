/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

export async function generateAuthToken({
  apiKey,
  userId
}: {
  apiKey: string;
  userId: string;
}) {
  return (
    await prisma.apiAuthToken.create({
      select: {
        token: true
      },
      data: {
        apiKey,
        userId
      }
    })
  ).token;
}

export async function clearAuthTokens(userId: string) {
  await prisma.apiAuthToken.deleteMany({
    where: { userId }
  });
}

export async function clearExpiredAuthTokens(userId: string) {
  await prisma.apiAuthToken.deleteMany({
    where: {
      userId,
      createdAt: {
        lte: new Date(Date.now() - 60000)
      }
    }
  });
}

export async function getAuthTokenDetails(token: string) {
  const authToken = await prisma.apiAuthToken.findFirst({
    select: { userId: true, createdAt: true },
    where: { token }
  });
  return {
    exists: authToken !== null,
    userId: authToken?.userId!,
    valid:
      authToken?.createdAt !== undefined &&
      authToken.createdAt.getTime() > Date.now() - 60000
  };
}
