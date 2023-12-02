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
  min: number;
  max: number;
  step: number;
  value: number;
  onChange(value: number): void;
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
        "h-2 w-full cursor-pointer appearance-none rounded-lg bg-black/50 accent-white",
        className
      )}
    />
  );
}
