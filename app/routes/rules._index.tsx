/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { middleware } from "~/http.server";
import { serverRulesSections } from "~/data/server-rules";
import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/rules._index";

export const meta = getMetaTitle("HeaderRulesLabel");

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  return null;
}

export default function Rules() {
  return (
    <div className="m-auto max-w-3xl px-4 py-8">
      <h1 className="font-display mb-6 text-2xl font-semibold text-white">
        Server Rules
      </h1>
      <div className="space-y-8">
        {serverRulesSections.map((section) => (
          <section key={section.id}>
            <h2 className="font-display mb-2 text-lg font-medium text-white">
              {section.title}
            </h2>
            <p className="text-neutral-300 prose prose-invert max-w-none">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
