/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as crypto from "node:crypto";

/**
 * PayTR Bildirim URL (callback) hash verification.
 * Formula: message = merchant_oid + merchant_salt + status + total_amount;
 * expected = base64(HMAC-SHA256(merchant_key, message)).
 * @see PayTR iframe-api 2. Adım
 */
export function verifyCallbackHash(
  merchant_oid: string,
  status: string,
  total_amount: string,
  hashFromPaytr: string,
  merchant_key: string,
  merchant_salt: string
): boolean {
  const message =
    merchant_oid + merchant_salt + status + total_amount;
  const expected = crypto
    .createHmac("sha256", merchant_key)
    .update(message)
    .digest("base64");
  return expected === hashFromPaytr;
}

/**
 * PayTR get-token request paytr_token.
 * hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode;
 * message = hash_str + merchant_salt;
 * return base64(HMAC-SHA256(merchant_key, message)).
 * @see PayTR iframe-api 1. Adım
 */
export function buildPaytrToken(params: {
  currency: string;
  email: string;
  max_installment: string;
  merchant_id: string;
  merchant_key: string;
  merchant_oid: string;
  merchant_salt: string;
  no_installment: string;
  payment_amount: number;
  test_mode: string;
  user_basket: string;
  user_ip: string;
}): string {
  const hashStr =
    params.merchant_id +
    params.user_ip +
    params.merchant_oid +
    params.email +
    String(params.payment_amount) +
    params.user_basket +
    params.no_installment +
    params.max_installment +
    params.currency +
    params.test_mode;
  const message = hashStr + params.merchant_salt;
  return crypto
    .createHmac("sha256", params.merchant_key)
    .update(message)
    .digest("base64");
}
