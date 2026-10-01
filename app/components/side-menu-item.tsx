/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ReactNode } from "react";
import { TextSlider } from "./text-slider";

export const SIDE_MENU_ITEM_HEIGHT = 32;

export function SideMenuItem({
  icon,
  isActive,
  label,
  onClick,
  right
}: {
  icon: ReactNode;
  isActive: boolean;
  label: string;
  onClick: () => void;
  right?: ReactNode;
}) {
  const isIdle = !isActive;
  return (
    <button
      className={clsx(
        "relative flex w-full cursor-default items-center justify-between gap-2 overflow-hidden px-4 pl-8 text-left transition-all",
        isIdle &&
          "group text-neutral-500 hover:bg-black/5 hover:text-neutral-300",
        isActive && "bg-black/20 text-blue-500"
      )}
      onClick={onClick}
      style={{ height: SIDE_MENU_ITEM_HEIGHT }}
    >
      <div
        className={clsx(
          "absolute top-1 left-5 flex -rotate-12 opacity-15 transition-all",
          isActive ? "scale-200" : "scale-150"
        )}
      >
        {icon}
      </div>
      <div className="font-display min-w-0 flex-1 font-bold whitespace-nowrap drop-shadow-sm">
        <TextSlider text={label} />
      </div>
      {right}
    </button>
  );
}
