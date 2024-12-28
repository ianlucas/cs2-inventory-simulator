/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation } from "react-router";
import clsx from "clsx";
import { ComponentProps } from "react";

export function HeaderLink({
  className,
  disabled,
  disabledText,
  icon,
  iconStyles,
  label,
  ...props
}: ComponentProps<typeof Link> & {
  disabled?: boolean;
  disabledText?: string;
  icon?: IconProp;
  iconStyles?: string;
  label?: string;
}) {
  const location = useLocation();
  const isActive = location.pathname === props.to;
  const baseStyles =
    "flex items-center gap-2 px-2 py-1 text-base lg:px-1.5 lg:py-1 lg:[font-size:inherit] transition-all";
  const content =
    props.children !== undefined ? (
      props.children
    ) : (
      <>
        {icon !== undefined && (
          <FontAwesomeIcon className={clsx(iconStyles ?? "h-4")} icon={icon} />
        )}
        {label}
      </>
    );
  if (disabled) {
    return (
      <span className={clsx("group relative select-none")}>
        <span className={clsx(baseStyles, "opacity-50 group-hover:opacity-70")}>
          {content}
        </span>
        {disabledText && (
          <div className="pointer-events-none absolute left-1/2 top-[100%] whitespace-nowrap bg-black/50 px-1 opacity-0 transition-all group-hover:opacity-100">
            {disabledText}
          </div>
        )}
      </span>
    );
  }
  return (
    <Link
      {...props}
      className={clsx(
        baseStyles,
        "hover:bg-black/30 active:bg-black/70",
        isActive && "bg-black/30",
        className
      )}
      children={content}
    />
  );
}
