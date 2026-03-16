/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useLoaderData } from "react-router";
import { VipPageContent } from "~/components/vip-page-content";
import { vipPackages, vipBenefits } from "~/data/vip-packages";
import {
  BYNOGAME_VIP_URL,
  PAYTR_MERCHANT_ID,
  PAYTR_MERCHANT_KEY,
  PAYTR_MERCHANT_SALT
} from "~/env.server";
import { middleware } from "~/http.server";
import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/vip._index";

export const meta = getMetaTitle("HeaderVipLabel");

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  const paytrConfigured = !!(
    PAYTR_MERCHANT_ID &&
    PAYTR_MERCHANT_KEY &&
    PAYTR_MERCHANT_SALT
  );
  return {
    packages: vipPackages,
    benefits: vipBenefits,
    bynogameUrl: BYNOGAME_VIP_URL ?? null,
    paytrConfigured
  };
}

export default function Vip() {
  const { packages, benefits, bynogameUrl, paytrConfigured } =
    useLoaderData<typeof loader>();
  return (
    <VipPageContent
      packages={packages}
      benefits={benefits}
      bynogameUrl={bynogameUrl}
      paytrConfigured={paytrConfigured}
    />
  );
}
