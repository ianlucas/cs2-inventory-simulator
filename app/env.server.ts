/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import "dotenv/config";
import invariant from "tiny-invariant";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");
export const SESSION_SECRET = process.env.SESSION_SECRET;

invariant(process.env.STEAM_CALLBACK_URL, "STEAM_CALLBACK_URL must be set");
export const STEAM_CALLBACK_URL = process.env.STEAM_CALLBACK_URL;

invariant(process.env.STEAM_API_KEY, "STEAM_API_KEY must be set");
export const STEAM_API_KEY = process.env.STEAM_API_KEY;

invariant(process.env.MAX_INVENTORY_ITEMS, "MAX_INVENTORY_ITEMS must be set");
export const MAX_INVENTORY_ITEMS = parseInt(
  process.env.MAX_INVENTORY_ITEMS,
  10
);

invariant(
  process.env.MAX_INVENTORY_STORAGE_UNIT_ITEMS,
  "MAX_INVENTORY_STORAGE_UNIT_ITEMS must be set"
);
export const MAX_INVENTORY_STORAGE_UNIT_ITEMS = parseInt(
  process.env.MAX_INVENTORY_STORAGE_UNIT_ITEMS,
  10
);

export const NAMETAG_DEFAULT_ALLOWED =
  process.env.NAMETAG_DEFAULT_ALLOWED === undefined ||
  process.env.NAMETAG_DEFAULT_ALLOWED.trim() === ""
    ? []
    : process.env.NAMETAG_DEFAULT_ALLOWED.split(",").map((id) =>
        Number(id.trim())
      );

export const BUILD_LAST_COMMIT_PATH = resolve(
  process.cwd(),
  ".build-last-commit"
);
export const BUILD_LAST_COMMIT = existsSync(BUILD_LAST_COMMIT_PATH)
  ? readFileSync(BUILD_LAST_COMMIT_PATH, "utf-8")
  : undefined;
