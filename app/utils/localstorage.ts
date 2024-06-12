/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function getFromLocalStorage(key: string) {
  if (typeof document !== "undefined") {
    return window.localStorage.getItem(key);
  }
  return undefined;
}

export function setToLocalStorage(key: string, value: string) {
  if (typeof document !== "undefined") {
    return window.localStorage.setItem(key, value);
  }
}
