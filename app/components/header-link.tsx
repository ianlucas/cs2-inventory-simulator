/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation } from "@remix-run/react";
import clsx from "clsx";
import { ComponentProps } from "react";

export function HeaderLink(
  { icon, label, ...rest }: ComponentProps<typeof Link> & {
    icon: IconProp;
    label?: string;
  }
) {
  const location = useLocation();
  const isActive = location.pathname === rest.to;
  return (
    <Link
      {...rest}
      className={clsx(
        "flex items-center gap-2 hover:bg-black/30 active:bg-black/70 transition-all px-2 lg:px-1.5 py-1 lg:py-1 text-base lg:[font-size:inherit]",
        isActive && "bg-black/30"
      )}
    >
      <FontAwesomeIcon className="h-4" icon={icon} />
      {label}
    </Link>
  );
}
