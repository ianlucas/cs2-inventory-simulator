/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function UnlockCaseAttribute({
  label,
  value
}: {
  label: string;
  value?: any;
}) {
  return value !== undefined ? (
    <div>
      <div className="text-sm font-bold">{label}</div>
      <div>{value}</div>
    </div>
  ) : null;
}
