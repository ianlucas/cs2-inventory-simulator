/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";

export function EditorStepRange({
  className,
  min,
  max,
  step,
  value,
  onChange
}: {
  className?: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      step={step}
      onChange={(event) => onChange(Number(event.target.value))}
      className={clsx(
        "h-2 w-full appearance-none rounded-lg bg-black/50 accent-white active:accent-blue-500/50",
        className
      )}
    />
  );
}
