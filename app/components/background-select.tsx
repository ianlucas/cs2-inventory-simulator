/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentProps } from "react";
import { Select } from "./select";

export function BackgroundSelect({
  onChange,
  options,
  value
}: {
  options: {
    label: string;
    value: string;
  }[];
} & Omit<ComponentProps<typeof Select>, "children" | "options">) {
  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      children={({ label }) => label}
    />
  );
}
