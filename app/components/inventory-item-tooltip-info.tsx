/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentProps } from "react";

export function InventoryItemTooltipInfo({
  label,
  ...props
}: ComponentProps<"div"> & {
  label: string;
}) {
  return (
    <>
      <div className="text-neutral-400">{label}</div>
      <div className="ml-2">
        <div {...props} />
      </div>
    </>
  );
}
