/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { api } from "~/api.server";
import {
  PAYTR_MERCHANT_KEY,
  PAYTR_MERCHANT_SALT
} from "~/env.server";
import { getMySQLPool } from "~/mysql.server";
import { methodNotAllowed } from "~/responses.server";
import { verifyCallbackHash } from "~/utils/paytr.server";
import type { Route } from "./+types/api.vip.paytr-callback._index";

function okResponse() {
  return new Response("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

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

  const formData = await request.formData();
  const merchant_oid = String(formData.get("merchant_oid") ?? "");
  const status = String(formData.get("status") ?? "");
  const total_amount = String(formData.get("total_amount") ?? "");
  const hash = String(formData.get("hash") ?? "");

  const merchant_key = PAYTR_MERCHANT_KEY;
  const merchant_salt = PAYTR_MERCHANT_SALT;
  if (!merchant_key || !merchant_salt) {
    return new Response("PAYTR_CONFIG", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  if (
    !verifyCallbackHash(
      merchant_oid,
      status,
      total_amount,
      hash,
      merchant_key,
      merchant_salt
    )
  ) {
    return new Response("INVALID_HASH", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  if (status !== "success") {
    return okResponse();
  }

  const pool = getMySQLPool();
  if (!pool) {
    return new Response("MYSQL_UNAVAILABLE", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const [existingVip] = await pool.execute<
    { merchant_oid: string }[]
  >("SELECT merchant_oid FROM vip WHERE merchant_oid = ?", [merchant_oid]);
  if (Array.isArray(existingVip) && existingVip.length > 0) {
    return okResponse();
  }

  const [pendingRows] = await pool.execute<
    { email: string; package_duration_months: number }[]
  >(
    "SELECT email, package_duration_months FROM vip_pending WHERE merchant_oid = ?",
    [merchant_oid]
  );
  const pending = Array.isArray(pendingRows) ? pendingRows[0] : null;
  if (!pending) {
    return okResponse();
  }

  const now = new Date();
  const expires_at = addMonths(now, pending.package_duration_months);

  await pool.execute(
    "INSERT INTO vip (merchant_oid, email, package_duration_months, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
    [
      merchant_oid,
      pending.email,
      pending.package_duration_months,
      expires_at,
      now
    ]
  );

  await pool.execute("DELETE FROM vip_pending WHERE merchant_oid = ?", [
    merchant_oid
  ]);

  return okResponse();
});
