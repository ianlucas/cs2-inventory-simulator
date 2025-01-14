/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ChangeEvent, ComponentProps } from "react";

export function EditorSelect({
  className,
  onChange,
  options,
  placeholder,
  styleless,
  value,
  ...rest
}: Omit<ComponentProps<"select">, "onChange"> & {
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  styleless?: boolean;
  value: string;
}) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value);
  }

  return (
    <select
      {...rest}
      className={clsx(
        !styleless && "h-[24px] rounded bg-black/50 outline-none",
        !styleless && value === "" && "text-neutral-600",
        className
      )}
      onChange={handleChange}
      value={value}
    >
      {placeholder !== undefined && (
        <option className="bg-black py-1 text-neutral-600" value="">
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          className="bg-black py-1 text-white"
          key={option}
          value={option}
        >
          {option}
        </option>
      ))}
    </select>
  );
}
