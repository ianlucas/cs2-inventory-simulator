/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

type UserPreferenceKeys =
  | "background"
  | "language"
  | "statsForNerds"
  | "hideFreeItems"
  | "hideFilters";

export async function getUserPreference(
  domainId: string,
  userId: string,
  key: UserPreferenceKeys
) {
  return (
    (await prisma.userPreference.findFirst({ where: { userId, domainId } }))?.[
      key
    ] || undefined
  );
}

export async function getUserPreferences<Keys extends UserPreferenceKeys>(
  domainId: string,
  userId: string,
  keys: Keys[]
) {
  return Object.fromEntries(
    await Promise.all(
      keys.map(
        async (key) =>
          [key, await getUserPreference(domainId, userId, key)] as const
      )
    )
  ) as { [k in Keys]: Awaited<ReturnType<typeof getUserPreference>> };
}

export async function setUserPreference(
  domainId: string,
  userId: string,
  preference: UserPreferenceKeys,
  value: string | null
) {
  return await prisma.userPreference.upsert({
    create: { [preference]: value, userId },
    update: { [preference]: value },
    where: { userId_domainId: { userId, domainId } }
  });
}

export async function setUserPreferences(
  domainId: string,
  userId: string,
  preferences: { [key in UserPreferenceKeys]: string | null }
) {
  return await prisma.userPreference.upsert({
    create: { ...preferences, userId },
    update: preferences,
    where: { userId_domainId: { userId, domainId } }
  });
}
