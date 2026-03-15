/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { api } from "~/api.server";
import { vipPackages } from "~/data/vip-packages";
import {
  PAYTR_MERCHANT_ID,
  PAYTR_MERCHANT_KEY,
  PAYTR_MERCHANT_SALT,
  PAYTR_TEST_MODE
} from "~/env.server";
import { getMySQLPool } from "~/mysql.server";
import { methodNotAllowed } from "~/responses.server";
import { buildPaytrToken } from "~/utils/paytr.server";
import type { Route } from "./+types/api.vip.paytr-token._index";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loader = async ({ request }: Route.LoaderArgs) => {
  if (request.method === "GET") {
    throw methodNotAllowed;
  }
  return null;
};

export const action = api(async ({ request }: Route.ActionArgs) => {
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }

  let packageId: string;
  let email: string;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    packageId = String(body.packageId ?? "").trim();
    email = String(body.email ?? "").trim();
  } else {
    const formData = await request.formData();
    packageId = String(formData.get("packageId") ?? "").trim();
    email = String(formData.get("email") ?? "").trim();
  }

  if (!packageId || !email) {
    return new Response(
      JSON.stringify({ error: "packageId and email are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const pkg = vipPackages.find((p) => p.id === packageId);
  if (!pkg) {
    return new Response(
      JSON.stringify({ error: "Invalid packageId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return new Response(
      JSON.stringify({ error: "Invalid email format" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const pool = getMySQLPool();
  if (!pool) {
    return new Response(
      JSON.stringify({ error: "PayTR not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const merchant_id = PAYTR_MERCHANT_ID;
  const merchant_key = PAYTR_MERCHANT_KEY;
  const merchant_salt = PAYTR_MERCHANT_SALT;
  if (!merchant_id || !merchant_key || !merchant_salt) {
    return new Response(
      JSON.stringify({ error: "PayTR not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const merchant_oid = crypto.randomUUID();
  const priceKurus = Math.round(pkg.priceTry * 100);
  const user_basket = Buffer.from(
    JSON.stringify([[pkg.label, pkg.priceTry.toFixed(2), 1]])
  ).toString("base64");

  // Local IP (e.g. 127.0.0.1) may cause PayTR to reject with "Geçersiz paytr_token" in dev; use public IP or proxy headers in production.
  const user_ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";

  const now = new Date();
  await pool.execute(
    "INSERT INTO vip_pending (merchant_oid, email, package_duration_months, amount_cents, created_at) VALUES (?, ?, ?, ?, ?)",
    [merchant_oid, email, pkg.durationMonths, priceKurus, now]
  );

  const paytr_token = buildPaytrToken({
    currency: "TL",
    email,
    max_installment: "0",
    merchant_id,
    merchant_key,
    merchant_oid,
    merchant_salt,
    no_installment: "0",
    payment_amount: priceKurus,
    test_mode: PAYTR_TEST_MODE ?? "0",
    user_basket,
    user_ip
  });

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const formBody = new URLSearchParams({
    merchant_id,
    user_ip,
    merchant_oid,
    email,
    payment_amount: String(priceKurus),
    paytr_token,
    user_basket,
    no_installment: "0",
    max_installment: "0",
    currency: "TL",
    test_mode: PAYTR_TEST_MODE ?? "0",
    iframe_v2: "1",
    merchant_ok_url: `${baseUrl}/vip?success=1`,
    merchant_fail_url: `${baseUrl}/vip?fail=1`
  });

  const paytrRes = await fetch("https://www.paytr.com/odeme/api/get-token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody.toString()
  });

  const paytrData = await paytrRes.json().catch(() => null);
  const token =
    paytrData && typeof paytrData.token === "string" ? paytrData.token : null;
  if (!token) {
    return new Response(
      JSON.stringify({ error: "PayTR token failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  return Response.json({ token });
});
