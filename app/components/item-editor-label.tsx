/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps } from "react";
import { TextSlider } from "./text-slider";

export function ItemEditorLabel({
  children,
  direction,
  label,
  labelStyles,
  ...props
}: ComponentProps<"div"> & {
  direction?: "left" | "right";
  label: string;
  labelStyles?: string;
}) {
  direction ??= "right";
  return (
    <div {...props}>
      <div
        className={clsx(
          "select-none whitespace-nowrap font-display font-bold text-neutral-500",
          direction === "left" ? "text-left" : "text-right",
          labelStyles !== undefined ? labelStyles : "w-[76.33px] lg:w-[128px]"
        )}
      >
        <TextSlider text={label} />
      </div>
      {children}
    </div>
  );
}
