/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { safeParseJson } from "./shared/misc";

export function getFromLocalStorage(key: string) {
  if (typeof document !== "undefined") {
    try {
      return window.localStorage.getItem(key);
    } catch {}
  }
  return undefined;
}

export function setToLocalStorage(key: string, value: string) {
  if (typeof document !== "undefined") {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  }
}

export function removeFromLocalStorage(key: string) {
  if (typeof document !== "undefined") {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }
}

export function getTypedFromLocalStorage<T>(key: string, defaultValue: T): T {
  const value = getFromLocalStorage(key);
  if (typeof value === "string") {
    return safeParseJson(value) ?? defaultValue;
  }
  return defaultValue;
}
