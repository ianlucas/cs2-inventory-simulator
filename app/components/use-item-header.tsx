/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InfoIcon } from "./info-icon";

export function UseItemHeader({
  actionDesc,
  actionItem,
  title,
  warning
}: {
  actionDesc: string;
  actionItem: string;
  title: string;
  warning: string;
}) {
  return (
    <div className="text-center drop-shadow">
      <div className="font-display text-3xl font-semibold leading-10 tracking-wider">
        {title}
      </div>
      <div className="text-lg">
        {actionDesc} <strong>{actionItem}</strong>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2">
        <InfoIcon />
        <span>{warning}</span>
      </div>
    </div>
  );
}
