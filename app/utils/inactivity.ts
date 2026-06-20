/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function isInactive(lastSeen: Date, days: number, now = Date.now()) {
  if (days <= 0) {
    return false;
  }
  return lastSeen.getTime() < now - days * DAY_IN_MS;
}
