/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentProps } from "react";

export function SettingsLabel({
  label,
  ...props
}: ComponentProps<"div"> & {
  label: string;
}) {
  return (
    <div className="flex h-12 items-center justify-between rounded-sm bg-neutral-800/50 px-3 py-1.5">
      <label className="font-display font-bold text-neutral-400">{label}</label>
      <div {...props} />
    </div>
  );
}
