/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ChangeEvent, ComponentProps } from "react";

export default function EditorSelect({
  onChange,
  options,
  placeholder,
  value,
  ...rest
}: Omit<ComponentProps<"select">, "onChange"> & {
  onChange(value: string): void;
  options: string[];
  placeholder?: string;
  value: string;
}) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value);
  }

  return (
    <select
      {...rest}
      className={clsx(
        "bg-black/50 rounded h-[24px] outline-none",
        value === "" && "text-neutral-500"
      )}
      onChange={handleChange}
      value={value}
    >
      {placeholder !== undefined && (
        <option className="bg-black py-1 text-neutral-500" value="">
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
