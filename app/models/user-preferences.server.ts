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
  userId: string,
  preference: UserPreferenceKeys
) {
  return (
    (await prisma.userPreference.findFirst({ where: { userId } }))?.[
      preference
    ] || undefined
  );
}

export async function setUserPreference(
  userId: string,
  preference: UserPreferenceKeys,
  value: string | null
) {
  return await prisma.userPreference.upsert({
    create: { [preference]: value, userId },
    update: { [preference]: value },
    where: { userId }
  });
}
