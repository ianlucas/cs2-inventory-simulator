/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ChangeEvent } from "react";

const defaultFormatter = (value: number) => value.toFixed(2);

export function EditorRange({
  format,
  onChange,
  ...props
}: {
  format?: (value: number) => string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  format ??= defaultFormatter;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(Number(event.target.value));
  }

  return (
    <div className="flex items-center gap-4">
      <input
        {...props}
        className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-black/50 accent-white"
        onChange={handleChange}
        type="range"
      />
      <span className="text-sm">{format(props.value)}</span>
    </div>
  );
}
