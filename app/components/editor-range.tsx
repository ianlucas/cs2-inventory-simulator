/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ChangeEvent } from "react";

const defaultFormatter = (value: number) => value.toFixed(2);

export function EditorRange({
  format,
  onChange,
  valueStyles,
  ...props
}: {
  format?: (value: number) => string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
  valueStyles?: string;
}) {
  format ??= defaultFormatter;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(Number(event.target.value));
  }

  return (
    <div className="flex items-center gap-4">
      <span className={clsx("text-sm", valueStyles)}>
        {format(props.value)}
      </span>
      <input
        {...props}
        className="h-2 flex-1 appearance-none rounded-lg bg-black/50 accent-white active:accent-blue-500/50"
        onChange={handleChange}
        type="range"
      />
    </div>
  );
}
