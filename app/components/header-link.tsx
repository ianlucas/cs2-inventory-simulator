/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { ComponentProps } from "react";
import { Link, useLocation } from "react-router";
import { getSoundProps } from "~/interface-sounds";
import { SoundName } from "~/sound-events";
import { FitMarquee } from "./marquee";

export function HeaderLink({
  className,
  collapsed,
  disabled,
  disabledText,
  icon,
  iconStyles,
  label,
  tabSound,
  ...props
}: ComponentProps<typeof Link> & {
  collapsed?: boolean;
  disabled?: boolean;
  disabledText?: string;
  icon?: IconProp;
  iconStyles?: string;
  label?: string;
  /** Like the game's main menu tabs, plays only when switching to it. */
  tabSound?: SoundName;
}) {
  const location = useLocation();
  const isActive = !disabled && location.pathname === props.to;
  const baseStyles = clsx(
    "relative flex items-center gap-2 px-2 py-1 text-base lg:py-1 lg:[font-size:inherit] transition-all",
    collapsed ? "group box-content h-lh" : "lg:px-1.5"
  );
  const iconElement = icon !== undefined && (
    <FontAwesomeIcon
      className={clsx("shrink-0", iconStyles ?? "h-4")}
      icon={icon}
    />
  );
  const content =
    props.children !== undefined ? (
      props.children
    ) : collapsed ? (
      <>
        {iconElement}
        <span className="mask-reveal pointer-events-none absolute inset-y-0 left-0 z-10 flex whitespace-nowrap group-hover:mask-left">
          {/* Over an active link's background, 57% adds up to the label's 70%. */}
          <span
            className={clsx(
              "flex items-center px-2",
              isActive ? "bg-black/57" : "bg-black/70"
            )}
          >
            {iconElement}
          </span>
          <span className="flex items-center bg-black/70 pr-2 font-bold">
            {label}
          </span>
        </span>
      </>
    ) : (
      <>
        {iconElement}
        {label !== undefined && (
          <FitMarquee className="lg:max-w-40">{label}</FitMarquee>
        )}
      </>
    );
  if (disabled) {
    return (
      <span className={clsx("group relative select-none")}>
        <span
          className={clsx(
            baseStyles,
            "text-white/50 group-hover:text-white/70"
          )}
        >
          {content}
        </span>
        {disabledText && (
          <div className="pointer-events-none absolute top-full left-1/2 bg-black/50 px-1 whitespace-nowrap opacity-0 transition-all group-hover:opacity-100">
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
        !collapsed && "hover:bg-black/30 active:bg-black/70",
        isActive && "bg-black/30",
        className
      )}
      children={content}
      {...getSoundProps({
        hover: "mainmenu_rollover",
        press: tabSound !== undefined && isActive ? "none" : tabSound
      })}
    />
  );
}
