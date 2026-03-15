/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { getMySQLPool } from "./mysql.server";

function clearMySQLSingleton(): void {
  const g = global as unknown as { __singletons?: Record<string, unknown> };
  if (g.__singletons?.["mysql-pool"]) {
    delete g.__singletons["mysql-pool"];
  }
}

describe("getMySQLPool", () => {
  const envKey = "MYSQL_URL";
  let savedEnv: string | undefined;

  beforeEach(() => {
    savedEnv = process.env[envKey];
    clearMySQLSingleton();
  });

  afterEach(() => {
    if (savedEnv !== undefined) {
      process.env[envKey] = savedEnv;
    } else {
      delete process.env[envKey];
    }
  });

  test("returns null when MYSQL_URL is unset", () => {
    delete process.env[envKey];
    expect(getMySQLPool()).toBeNull();
  });

  test("returns null when MYSQL_URL is empty string", () => {
    process.env[envKey] = "";
    expect(getMySQLPool()).toBeNull();
  });

  test("returns pool when MYSQL_URL is set and returns same reference (singleton)", () => {
    process.env[envKey] = "mysql://localhost:3306/test";
    const pool1 = getMySQLPool();
    const pool2 = getMySQLPool();
    expect(pool1).not.toBeNull();
    expect(pool2).not.toBeNull();
    expect(pool1).toBe(pool2);
  });
});
