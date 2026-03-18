/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { ComponentRef, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { ClientOnly } from "remix-utils/client-only";

export function Modal({
  blur,
  children,
  className,
  fixed,
  hidden
}: {
  blur?: boolean;
  children: ReactNode;
  className?: string;
  fixed?: boolean;
  hidden?: boolean;
}) {
  const ref = useRef<ComponentRef<"div">>(null);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (ref.current !== null) {
      document.body.append(ref.current);
    }
    requestAnimationFrame(() => setAnimate(hidden ? true : false));
  }, [hidden]);

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <div
            className={clsx(
              hidden ? "hidden" : fixed ? "fixed" : "absolute",
              animate && "opacity-0",
              "top-0 left-0 z-50 flex min-h-full w-full items-center justify-center bg-linear-to-b from-black/15 to-transparent transition-opacity select-none",
              blur && "bg-black/50 lg:bg-transparent lg:backdrop-blur-[2px]"
            )}
            ref={ref}
          >
            <div
              className={clsx(
                "min-h-[inherit] rounded-sm border border-white/30 bg-neutral-900/98 text-white shadow-lg drop-shadow-lg lg:backdrop-blur-xs",
                className
              )}
            >
              {children}
            </div>
          </div>,
          document.body
        )
      }
    />
  );
}

export function ModalNav({
  items
}: {
  items: (
    | {
        icon: IconDefinition;
        isActive: boolean;
        label: string;
        onClick: () => void;
      }
    | false
  )[];
}) {
  const visibleItems = items.filter((item) => item !== false);
  if (visibleItems.length === 0) {
    return null;
  }
  return (
    <nav className="bg-black/30 px-1 pb-1 text-xs text-neutral-400">
      {visibleItems.map(({ label, onClick, icon, isActive }) => (
        <button
          key={label}
          className={clsx(
            "flex items-center gap-1.5 px-2 py-1 transition-all",
            isActive
              ? "bg-neutral-950/50 text-neutral-300"
              : "hover:bg-neutral-950/50 hover:text-neutral-300"
          )}
          onClick={onClick}
        >
          <FontAwesomeIcon className="h-3" icon={icon} />
          {label}
        </button>
      ))}
    </nav>
  );
}

export function ModalHeader({
  closeTo,
  onClose,
  title
}: {
  closeTo?: string;
  onClose?: () => void;
  title: string;
}) {
  return (
    <div className="bg-linear-to-t from-black/30 to-transparent p-1 pr-2 select-none">
      <div className="flex items-center justify-between bg-linear-to-r from-blue-500/30 to-transparent py-1 pl-2">
        <span className="font-display text-[0.9rem] font-bold text-neutral-200">
          {title}
        </span>
        <div className="flex items-center">
          {closeTo !== undefined && (
            <Link
              className="flex h-4 px-2 opacity-50 transition hover:opacity-100"
              to={closeTo}
            >
              <FontAwesomeIcon icon={faXmark} className="size-4" />
            </Link>
          )}
          {onClose !== undefined && (
            <button
              className="flex h-4 cursor-default px-2 opacity-50 transition hover:opacity-100"
              onClick={onClose}
            >
              <FontAwesomeIcon icon={faXmark} className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
