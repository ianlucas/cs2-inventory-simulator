/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import invariant from "tiny-invariant";

export const assert: typeof invariant = invariant;

export function fail(message: string): never {
  throw new Error(message);
}
