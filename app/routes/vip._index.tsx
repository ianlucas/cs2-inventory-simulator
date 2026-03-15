/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useLoaderData } from "react-router";
import { VipPageContent } from "~/components/vip-page-content";
import { vipPackages } from "~/data/vip-packages";
import { BYNOGAME_VIP_URL } from "~/env.server";
import { middleware } from "~/http.server";
import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/vip._index";

export const meta = getMetaTitle("HeaderVipLabel");

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  return {
    packages: vipPackages,
    bynogameUrl: BYNOGAME_VIP_URL ?? null
  };
}

export default function Vip() {
  const { packages, bynogameUrl } = useLoaderData<typeof loader>();
  return <VipPageContent packages={packages} bynogameUrl={bynogameUrl} />;
}
