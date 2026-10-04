/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps } from "react";

export function InventoryItemTooltipInfo({
  label,
  labelClassName,
  ...props
}: ComponentProps<"div"> & {
  label: string;
  labelClassName?: string;
}) {
  return (
    <>
      <div className={clsx("text-neutral-400", labelClassName)}>{label}</div>
      <div className="ml-2">
        <div {...props} />
      </div>
    </>
  );
}
