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
    <div>
      <label className="font-display font-bold text-neutral-500">{label}</label>
      <div {...props} />
    </div>
  );
}
