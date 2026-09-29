/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function resolveMaxAttachments(value: number, hardMax: number) {
  return value < 0 ? hardMax : Math.min(value, hardMax);
}

export function isAttachmentCountAllowed({
  current,
  max,
  next
}: {
  current: number;
  max: number;
  next: number;
}) {
  return next <= Math.max(max, current);
}
