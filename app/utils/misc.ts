/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import invariant from "tiny-invariant";

export const assert: typeof invariant = invariant;

export function fail(message: string): never {
  throw new Error(message);
}

export function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function safeParseJson(json: string): any {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

export function deleteEmptyProps(obj: any) {
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  }
}

export function has(str?: string) {
  return (str?.length ?? 0) > 0;
}
