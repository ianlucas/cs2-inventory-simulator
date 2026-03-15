/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as crypto from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  buildPaytrToken,
  verifyCallbackHash
} from "./paytr.server";

describe("verifyCallbackHash", () => {
  const key = "test_merchant_key";
  const salt = "test_merchant_salt";

  test("returns true when hash matches PayTR formula (merchant_oid + salt + status + total_amount)", () => {
    const merchant_oid = "oid-123";
    const status = "success";
    const total_amount = "9900";
    const message =
      merchant_oid + salt + status + total_amount;
    const expectedHash = crypto
      .createHmac("sha256", key)
      .update(message)
      .digest("base64");
    expect(
      verifyCallbackHash(
        merchant_oid,
        status,
        total_amount,
        expectedHash,
        key,
        salt
      )
    ).toBe(true);
  });

  test("returns false when hash does not match", () => {
    expect(
      verifyCallbackHash(
        "oid-123",
        "success",
        "9900",
        "wrong_hash_value",
        key,
        salt
      )
    ).toBe(false);
  });

  test("returns false when any field differs", () => {
    const merchant_oid = "oid-123";
    const status = "success";
    const total_amount = "9900";
    const message = merchant_oid + salt + status + total_amount;
    const validHash = crypto
      .createHmac("sha256", key)
      .update(message)
      .digest("base64");
    expect(
      verifyCallbackHash(
        "other-oid",
        status,
        total_amount,
        validHash,
        key,
        salt
      )
    ).toBe(false);
  });
});

describe("buildPaytrToken", () => {
  test("produces deterministic base64 string for fixed params", () => {
    const params = {
      currency: "TL",
      email: "user@test.com",
      max_installment: "0",
      merchant_id: "123456",
      merchant_key: "dummy_key",
      merchant_oid: "order-abc",
      merchant_salt: "dummy_salt",
      no_installment: "1",
      payment_amount: 9900,
      test_mode: "1",
      user_basket: "W1siVklQIDFB eSIsIjk5LjAwIiwxXV0=",
      user_ip: "1.2.3.4"
    };
    const token1 = buildPaytrToken(params);
    const token2 = buildPaytrToken(params);
    expect(token1).toBe(token2);
    expect(token1).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(token1.length).toBeGreaterThan(0);
  });

  test("different params produce different tokens", () => {
    const base = {
      currency: "TL",
      email: "user@test.com",
      max_installment: "0",
      merchant_id: "123456",
      merchant_key: "key",
      merchant_oid: "order-1",
      merchant_salt: "salt",
      no_installment: "1",
      payment_amount: 9900,
      test_mode: "1",
      user_basket: "W1siVklQIl0=",
      user_ip: "1.2.3.4"
    };
    const token1 = buildPaytrToken(base);
    const token2 = buildPaytrToken({
      ...base,
      merchant_oid: "order-2"
    });
    expect(token1).not.toBe(token2);
  });
});
