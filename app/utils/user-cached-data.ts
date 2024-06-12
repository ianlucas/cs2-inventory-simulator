/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getFromLocalStorage, setToLocalStorage } from "./localstorage";

export function cacheAuthenticatedUserId(value: string) {
  return setToLocalStorage("userId", value);
}

export function didUserAuthenticateInThisBrowser() {
  return typeof getFromLocalStorage("userId") === "string";
}
