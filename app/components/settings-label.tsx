/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentProps } from "react";
import { Marquee } from "./marquee";

export function SettingsLabel({
  label,
  ...props
}: ComponentProps<"div"> & {
  label: string;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 rounded-sm bg-neutral-800/50 px-3 py-1.5">
      <label className="font-display min-w-0 flex-1 font-bold text-neutral-400">
        <Marquee>{label}</Marquee>
      </label>
      <div {...props} />
    </div>
  );
}
