/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "react-router";
import { DEFAULT_APP_NAME } from "~/app-defaults";
import { Background } from "~/components/background";
import { ProfileInventory } from "~/components/profile-inventory";
import { ProfileUser } from "~/components/profile-user";
import { prisma } from "~/db.server";
import { middleware } from "~/middleware.server";
import { getRules } from "~/models/rule";
import {
  inventoryAllowProfile,
  inventoryItemEquipHideModel,
  inventoryItemEquipHideType,
  inventoryMaxItems,
  inventoryStorageUnitMaxItems
} from "~/models/rule.server";
import { getUserPreference } from "~/models/user-preference.server";
import type { SeoHandle } from "~/root-seo";
import { safeLoadInventory } from "~/shared/inventory";
import type { Route } from "./+types/profiles.$userId._index";

export const handle: SeoHandle<Route.ComponentProps["loaderData"]> = {
  seo: ({ user }) => ({
    image: user.avatar,
    path: `/profiles/${user.id}`,
    title: user.name
  })
};

export const meta: Route.MetaFunction = ({ loaderData, matches }) => {
  const appName = matches[0].loaderData.rules.appName || DEFAULT_APP_NAME;
  return [{ title: `${loaderData.user.name} - ${appName}` }];
};

export async function loader({
  params: { userId },
  request
}: Route.LoaderArgs) {
  await middleware(request);
  if (!/^\d{17}$/.test(userId)) {
    throw redirect("/");
  }
  const user = await prisma.user.findUnique({
    select: { avatar: true, id: true, name: true, rawInventory: true },
    where: { id: userId }
  });
  if (user === null || !(await inventoryAllowProfile.for(userId).get())) {
    throw redirect("/");
  }
  const rules = await getRules(
    {
      inventoryItemEquipHideModel,
      inventoryItemEquipHideType,
      inventoryMaxItems,
      inventoryStorageUnitMaxItems
    },
    userId
  );
  return {
    background: (await getUserPreference(userId, "background")) ?? null,
    inventory:
      safeLoadInventory(user.rawInventory, {
        maxItems: rules.inventoryMaxItems,
        storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
      })?.getData() ?? null,
    rules,
    user: { avatar: user.avatar, id: user.id, name: user.name }
  };
}

export default function Profile({
  loaderData: { background, inventory, rules, user }
}: Route.ComponentProps) {
  return (
    <>
      <Background background={background} />
      <ProfileUser avatar={user.avatar} name={user.name} />
      <ProfileInventory inventory={inventory} rules={rules} />
    </>
  );
}
