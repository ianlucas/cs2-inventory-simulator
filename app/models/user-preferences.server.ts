/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

export async function getUserPreference(
  userId: string,
  preference: "background" | "language"
) {
  return (
    (await prisma.userPreferences.findFirst({ where: { userId } }))?.[
      preference
    ] || undefined
  );
}

export async function setUserPreference(
  userId: string,
  preference: "background" | "language",
  value: string
) {
  return await prisma.userPreferences.upsert({
    create: { [preference]: value, userId },
    update: { [preference]: value },
    where: { userId }
  });
}
