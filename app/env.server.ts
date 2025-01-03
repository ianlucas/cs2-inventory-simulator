/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert } from "@ianlucas/cs2-lib";
import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { trim } from "./utils/misc";

assert(process.env.SESSION_SECRET, "SESSION_SECRET must be set");
export const SESSION_SECRET = process.env.SESSION_SECRET;

export const BUILD_LAST_COMMIT_PATH = resolve(
  process.cwd(),
  ".build-last-commit"
);
export const BUILD_LAST_COMMIT = existsSync(BUILD_LAST_COMMIT_PATH)
  ? trim(readFileSync(BUILD_LAST_COMMIT_PATH, "utf-8"))
  : undefined;

export const {
  ASSETS_BASE_URL,
  CLOUDFLARE_ANALYTICS_TOKEN,
  CS2_CSGO_PATH,
  STEAM_API_KEY,
  STEAM_CALLBACK_URL
} = process.env;
