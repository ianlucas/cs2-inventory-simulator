/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ReactNode, useEffect, useState } from "react";

export const FORM_ECHO_WINDOW_MS = 400;

export function attachmentName(name: string): string {
  const separator = name.indexOf("|");
  return separator === -1 ? name : name.slice(separator + 1).trim();
}

function DrawerTab({
  className,
  edge,
  label,
  onClick
}: {
  className?: string;
  edge: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx(
        "font-display pointer-events-auto flex shrink-0 items-center justify-center self-stretch px-1.5 py-3 text-sm font-bold text-neutral-200 transition",
        edge === "left" ? "rounded-r" : "rounded-l",
        className
      )}
      onClick={onClick}
      title={label}
    >
      <span className="max-h-full truncate [writing-mode:vertical-rl]">
        {label}
      </span>
    </button>
  );
}

export function AttachmentSlotsDrawer({
  children,
  className,
  label,
  listClassName
}: {
  children: ReactNode;
  className?: string;
  label: string;
  listClassName?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 flex h-full items-center p-4">
      <div
        className={clsx(
          "flex max-h-full items-center transition-transform duration-150 ease-out",
          !open && "-translate-x-84",
          className
        )}
      >
        <div
          className={clsx(
            "pointer-events-none flex max-h-full w-80 flex-col gap-1 rounded-l bg-neutral-900/80",
            listClassName
          )}
        >
          {children}
        </div>
        <DrawerTab
          className="bg-neutral-900/80 hover:bg-neutral-700/80"
          edge="left"
          label={label}
          onClick={() => setOpen((value) => !value)}
        />
      </div>
    </div>
  );
}

export function AttachmentEditorDrawer({
  children,
  label,
  panelClassName
}: {
  children: ReactNode;
  label: string;
  panelClassName?: string;
}) {
  const [entered, setEntered] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex h-full items-center p-4">
      <div
        className={clsx(
          "flex max-h-full items-center transition duration-150 ease-out",
          entered ? "opacity-100" : "opacity-0",
          collapsed || !entered ? "translate-x-94" : "translate-x-0"
        )}
      >
        <DrawerTab
          className="bg-neutral-900/90 shadow-lg hover:bg-neutral-800/90"
          edge="right"
          label={label}
          onClick={() => setCollapsed((value) => !value)}
        />
        <div
          className={clsx(
            "pointer-events-auto flex max-h-full w-90 flex-col overflow-hidden rounded-r bg-neutral-900/90 shadow-lg",
            panelClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
