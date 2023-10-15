/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import "dotenv/config";
import invariant from "tiny-invariant";

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
