/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCrown, faCheck, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  benefits,
  bynogameUrl,
  paytrConfigured
}: {
  packages: VipPackage[];
  benefits: { title: string; description: string }[];
  bynogameUrl: string | null;
  paytrConfigured: boolean;
}) {
  const [email, setEmail] = useState("");
  const fetcher = useFetcher<{ token?: string; error?: string }>();
  const scriptLoadedRef = useRef(false);

  const token = fetcher.data?.token;
  const error = fetcher.data?.error;
  const isLoading =
    fetcher.state === "submitting" || fetcher.state === "loading";

  /** PayTR yapılandırılmamışsa Bynogame linkini göster (ana CTA) */
  const showBynogameOnly = !paytrConfigured && bynogameUrl;
  const showBynogameLink = bynogameUrl != null;
  const showPaytr = paytrConfigured;

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
    <div className="m-auto max-w-4xl px-4 py-10">
      {/* Hero */}
      <div className="relative mb-12 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/60 via-stone-900 to-stone-900 px-8 py-10 shadow-xl">
        <div className="absolute right-4 top-4 opacity-20">
          <FontAwesomeIcon icon={faCrown} className="h-24 w-24 text-amber-400" />
        </div>
        <div className="relative">
          <span className="mb-3 inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
            VIP Üyelik
          </span>
          <h1 className="font-display mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Sunucuda Fark Yaratın
          </h1>
          <p className="max-w-xl text-lg text-neutral-300">
            VIP üyeliği ile öncelikli giriş, özel rozet, rezerv slot ve daha fazlasından yararlanın.
          </p>
        </div>
      </div>

      {/* Ayrıcalıklar */}
      <section className="mb-12">
        <h2 className="font-display mb-6 text-xl font-semibold text-white">
          VIP Ayrıcalıkları
        </h2>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-xl border border-stone-600/40 bg-stone-800/50 p-5 transition hover:border-stone-500/50 hover:bg-stone-800/70"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                <FontAwesomeIcon icon={faCheck} className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display mb-1 font-medium text-white">
                  {b.title}
                </h3>
                <p className="text-sm text-neutral-400">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Paketler */}
      <section>
        <h2 className="font-display mb-6 text-xl font-semibold text-white">
          Paketler
        </h2>
        {showBynogameLink && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
            <strong>Bynogame:</strong> Kaç aylık almak istiyorsanız o kadar adet satın almanız gerekir (1 ay = 1 adet, 3 ay = 3 adet). 6 aylık paket için 5 adet satın almanız yeterlidir.
          </div>
        )}
        {showPaytr && (
          <div className="mb-6 max-w-md">
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
              className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col rounded-2xl border border-stone-600/50 bg-stone-900/80 shadow-lg transition hover:border-amber-500/40 hover:shadow-amber-500/5 hover:shadow-xl"
            >
              <div className="border-b border-stone-600/50 px-6 py-5">
                <h3 className="font-display text-lg font-semibold text-white">
                  {pkg.label}
                </h3>
                <p className="mt-1 text-sm text-neutral-400">
                  {pkg.durationMonths} ay geçerli
                </p>
                <p className="mt-3 text-2xl font-bold text-amber-400">
                  {pkg.priceTry} ₺
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                {showBynogameOnly && (
                  <a
                    href={bynogameUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-medium text-stone-900 transition hover:bg-amber-400"
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="h-4 w-4" />
                    Bynogame&apos;da Satın Al
                  </a>
                )}
                {showBynogameLink && !showBynogameOnly && (
                  <a
                    href={bynogameUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 font-medium text-amber-400 transition hover:bg-amber-500/20"
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="h-4 w-4" />
                    Bynogame&apos;da al
                  </a>
                )}
                {showPaytr && (
                  <button
                    type="button"
                    disabled={isLoading || !email.trim()}
                    onClick={() => handlePaytrSubmit(pkg.id)}
                    className="rounded-xl bg-stone-700 px-4 py-3 font-medium text-white transition hover:bg-stone-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? "Yükleniyor…" : "PayTR ile öde"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {showPaytr && (
        <p className="mt-6 text-center text-sm text-neutral-500">
          E-posta adresiniz yalnızca ödeme ve VIP kaydı için kullanılır.
        </p>
      )}

      {error && (
        <p className="mt-6 text-center text-red-400" role="alert">
          {error}
        </p>
      )}

      {token && (
        <div className="mt-10 rounded-xl border border-stone-600/50 bg-stone-900/80 p-4">
          <p className="mb-3 text-sm font-medium text-white">
            Ödeme sayfası aşağıdadır. İşlemi tamamlayın.
          </p>
          <iframe
            id="paytriframe"
            src={`https://www.paytr.com/odeme/guvenli/${token}`}
            frameBorder={0}
            scrolling="no"
            style={{ width: "100%", minHeight: "400px" }}
            title="PayTR ödeme"
          />
        </div>
      )}
    </div>
  );
}
