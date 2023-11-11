/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

export async function getUserLanguagePreference(userId: string) {
  return (await prisma.userPreferences.findFirst({ where: { userId } }))
    ?.language || undefined;
}

export async function setUserLanguagePreference(
  userId: string,
  language: string
) {
  return await prisma.userPreferences.upsert({
    create: { language, userId },
    update: { language },
    where: { userId }
  });
}
