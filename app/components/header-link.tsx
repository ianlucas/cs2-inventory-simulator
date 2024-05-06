/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation } from "@remix-run/react";
import clsx from "clsx";
import { ComponentProps } from "react";

export function HeaderLink({
  className,
  icon,
  iconStyles,
  label,
  ...props
}: ComponentProps<typeof Link> & {
  icon?: IconProp;
  iconStyles?: string;
  label?: string;
}) {
  const location = useLocation();
  const isActive = location.pathname === props.to;
  return (
    <Link
      {...props}
      className={clsx(
        "flex items-center gap-2 px-2 py-1 text-base transition-all hover:bg-black/30 active:bg-black/70 lg:px-1.5 lg:py-1 lg:[font-size:inherit]",
        isActive && "bg-black/30",
        className
      )}
    >
      {props.children !== undefined ? (
        props.children
      ) : (
        <>
          {icon !== undefined && (
            <FontAwesomeIcon
              className={clsx(iconStyles ?? "h-4")}
              icon={icon}
            />
          )}
          {label}
        </>
      )}
    </Link>
  );
}
