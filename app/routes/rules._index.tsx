/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RulesPageContent } from "~/components/rules-page-content";
import { serverRulesSections } from "~/data/server-rules";
import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/rules._index";
import { middleware } from "~/http.server";

export const meta = getMetaTitle("HeaderRulesLabel");

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  return null;
}

export default function Rules() {
  return <RulesPageContent sections={serverRulesSections} />;
}
