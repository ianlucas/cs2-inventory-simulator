/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { VipPackage } from "~/data/vip-packages";

export function VipPageContent({
  packages,
  bynogameUrl
}: {
  packages: VipPackage[];
  bynogameUrl: string | null;
}) {
  return (
    <div className="m-auto max-w-3xl px-4 py-8">
      <div className="rounded-xl border border-stone-600/50 bg-stone-900/80 px-6 py-8 shadow-lg backdrop-blur-sm">
        <h1 className="font-display mb-6 text-2xl font-semibold text-white">
          VIP Satın Al
        </h1>
        <p className="mb-8 text-neutral-300 prose prose-invert max-w-none">
          VIP üyeliği ile sunucuda özel ayrıcalıklardan yararlanın: öncelikli
          giriş, özel rozet ve daha fazlası.
        </p>
        <div className="space-y-6">
          {packages.map((pkg) => (
            <section
              key={pkg.id}
              className="rounded-lg border border-stone-600/40 bg-stone-800/60 px-4 py-4"
            >
              <h2 className="font-display mb-2 text-lg font-medium text-white">
                {pkg.label}
              </h2>
              <p className="mb-4 text-neutral-400">
                {pkg.durationMonths} ay · {pkg.priceTry} ₺
              </p>
              <div className="flex flex-wrap gap-3">
                {bynogameUrl && (
                  <a
                    href={bynogameUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-500"
                  >
                    Bynogame&apos;da al
                  </a>
                )}
                <button
                  type="button"
                  disabled
                  className="rounded border border-stone-500 bg-stone-700/50 px-3 py-2 text-sm text-neutral-400 cursor-not-allowed"
                >
                  PayTR ile öde (Yakında)
                </button>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
