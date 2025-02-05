/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { ChangeEventHandler } from "react";

export function IconInput({
  icon,
  labelStyles,
  onChange,
  placeholder,
  value
}: {
  icon: IconProp;
  labelStyles?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  value: string;
}) {
  return (
    <label
      className={clsx(
        "group flex items-center gap-2 bg-neutral-950/40 px-2 py-1 ring-blue-500/50 has-focus:ring-2",
        labelStyles
      )}
    >
      <FontAwesomeIcon
        icon={icon}
        className="h-4 text-neutral-500 group-focus-within:text-blue-500/50"
      />
      <input
        value={value}
        onChange={onChange}
        className="flex-1 bg-transparent placeholder-neutral-600 outline-hidden"
        placeholder={placeholder}
      />
    </label>
  );
}
