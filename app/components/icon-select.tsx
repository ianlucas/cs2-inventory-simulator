/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { ComponentProps } from "react";
import { EditorSelect } from "./editor-select";

export function IconSelect({
  icon,
  ...props
}: {
  icon: IconProp;
} & ComponentProps<typeof EditorSelect>) {
  return (
    <label className="group flex items-center gap-2 bg-neutral-950/40 px-2 py-1 ring-blue-500/50 has-[:focus]:ring-2">
      <FontAwesomeIcon
        icon={icon}
        className="h-4 text-neutral-500 group-focus-within:text-blue-500/50"
      />
      <EditorSelect
        {...props}
        className={clsx("bg-transparent", props.className)}
      />
    </label>
  );
}
