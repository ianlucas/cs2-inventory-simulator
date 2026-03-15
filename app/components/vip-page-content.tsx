/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { VipPackage } from "~/data/vip-packages";

declare global {
  interface Window {
    iFrameResize?: (options: object, selector: string) => void;
  }
}

export function VipPageContent({
  packages,
  bynogameUrl
}: {
  packages: VipPackage[];
  bynogameUrl: string | null;
}) {
  const [email, setEmail] = useState("");
  const fetcher = useFetcher<{ token?: string; error?: string }>();
  const scriptLoadedRef = useRef(false);

  const token = fetcher.data?.token;
  const error = fetcher.data?.error;
  const isLoading =
    fetcher.state === "submitting" || fetcher.state === "loading";

  const handlePaytrSubmit = (packageId: string) => {
    if (!email.trim()) return;
    const formData = new FormData();
    formData.set("packageId", packageId);
    formData.set("email", email.trim());
    fetcher.submit(formData, {
      method: "POST",
      action: "/api/vip/paytr-token",
      encType: "application/x-www-form-urlencoded"
    });
  };

  useEffect(() => {
    if (!token || scriptLoadedRef.current) return;
    const script = document.createElement("script");
    script.src = "https://www.paytr.com/js/iframeResizer.min.js?v2";
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      if (window.iFrameResize) {
        window.iFrameResize({}, "#paytriframe");
      }
    };
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [token]);

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

        <div className="mb-6">
          <label
            htmlFor="vip-email"
            className="mb-2 block text-sm font-medium text-neutral-300"
          >
            E-posta (PayTR için gerekli)
          </label>
          <input
            id="vip-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@email.com"
            required
            className="w-full max-w-md rounded border border-stone-600 bg-stone-800 px-3 py-2 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

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
                  disabled={isLoading || !email.trim()}
                  onClick={() => handlePaytrSubmit(pkg.id)}
                  className="rounded border border-stone-500 bg-stone-700/50 px-3 py-2 text-sm text-white transition hover:bg-stone-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Yükleniyor..." : "PayTR ile öde"}
                </button>
              </div>
            </section>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-red-400" role="alert">
            {error}
          </p>
        )}

        {token && (
          <div className="mt-8">
            <iframe
              id="paytriframe"
              src={`https://www.paytr.com/odeme/guvenli/${token}`}
              frameBorder={0}
              scrolling="no"
              style={{ width: "100%" }}
              title="PayTR ödeme"
            />
          </div>
        )}
      </div>
    </div>
  );
}
