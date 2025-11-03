/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert } from "@ianlucas/cs2-lib";
import dotenv from "dotenv";

dotenv.config({
  quiet: true
});

assert(process.env.SESSION_SECRET, "SESSION_SECRET must be set");
export const SESSION_SECRET = process.env.SESSION_SECRET;

export const {
  ASSETS_BASE_URL,
  CLOUDFLARE_ANALYTICS_TOKEN,
  CS2_CSGO_PATH,
  SOURCE_COMMIT,
  STEAM_API_KEY,
  STEAM_CALLBACK_URL
} = process.env;
