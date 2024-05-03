/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps } from "react";

export function ItemEditorLabel({
  children,
  label,
  labelStyles,
  ...props
}: ComponentProps<"div"> & {
  label: string;
  labelStyles?: string;
}) {
  return (
    <div {...props}>
      <label
        className={clsx(
          "select-none text-right font-display font-bold text-neutral-500",
          labelStyles !== undefined ? labelStyles : "w-[76.33px]"
        )}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
