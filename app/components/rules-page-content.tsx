/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ServerRulesSection } from "~/data/server-rules";

export function RulesPageContent({
  sections
}: {
  sections: ServerRulesSection[];
}) {
  return (
    <div className="m-auto max-w-3xl px-4 py-8">
      <div className="rounded-xl border border-stone-600/50 bg-stone-900/80 px-6 py-8 shadow-lg backdrop-blur-sm">
        <h1 className="font-display mb-6 text-2xl font-semibold text-white">
          Server Rules
        </h1>
        <div className="space-y-8">
          {sections.map((section) => (
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
    </div>
  );
}
