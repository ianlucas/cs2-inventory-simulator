/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";

export function ChipMenuItem({
  isActive,
  label,
  onClick
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx(
        "font-display rounded-sm px-2 font-bold transition-all hover:text-neutral-200",
        isActive ? "bg-black/50 text-neutral-200" : "text-neutral-400"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
