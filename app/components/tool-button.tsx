/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { ComponentProps } from "react";
import { ButtonWithTooltip } from "./button-with-tooltip";

export function ToolButton({
  icon,
  isBorderless,
  ...props
}: ComponentProps<typeof ButtonWithTooltip> & {
  icon: IconProp;
  isBorderless?: boolean;
}) {
  return (
    <ButtonWithTooltip
      {...props}
      className={clsx(
        "cursor-default px-1.5 py-1.5 hover:bg-white/20 disabled:opacity-50",
        !isBorderless && "border border-white/50"
      )}
    >
      <FontAwesomeIcon className="h-4" icon={icon} />
    </ButtonWithTooltip>
  );
}
