/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps } from "react";
import { TextSlider } from "./text-slider";

export function EditorLabel({
  block,
  children,
  isDisabled,
  label,
  ...props
}: ComponentProps<"div"> & {
  block?: boolean;
  isDisabled?: boolean;
  label: string;
}) {
  return (
    <div
      {...props}
      className={clsx(
        !block &&
          clsx("flex items-center gap-2 pl-3", isDisabled ? "pr-3" : "pr-1.5"),
        block && "px-1.5",
        "rounded bg-neutral-800/50 py-1.5"
      )}
    >
      <label
        className={clsx(
          !block && "flex w-[138px]",
          block && "block pl-1.5",
          "select-none items-center whitespace-nowrap font-display font-bold text-neutral-400"
        )}
      >
        <TextSlider text={label} />
      </label>
      {children}
    </div>
  );
}
