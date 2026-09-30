/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  getFromLocalStorage,
  getTypedFromLocalStorage,
  setToLocalStorage
} from "./local-storage";

export const APP_VOLUME_STORAGE_KEY = "appVolume";
export const DEFAULT_APP_VOLUME = 1;

export function cacheAuthenticatedUserId(value: string) {
  return setToLocalStorage("userId", value);
}

export function didUserAuthenticateInThisBrowser() {
  return typeof getFromLocalStorage("userId") === "string";
}

export function getAppVolume() {
  return getTypedFromLocalStorage(APP_VOLUME_STORAGE_KEY, DEFAULT_APP_VOLUME);
}
