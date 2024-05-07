/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface UnlockCaseEventData {
  caseUid: number;
  keyUid?: number;
}

export const app = new EventTarget();

export function dispatchAppEvent(
  name: "unlockcase",
  payload: UnlockCaseEventData
): void;
export function dispatchAppEvent(name: string, payload: any) {
  app.dispatchEvent(new CustomEvent(name, { detail: payload }));
}
