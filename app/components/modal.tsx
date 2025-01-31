/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faXmark } from "@fortawesome/free-solid-svg-icons";
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
              "left-0 top-0 z-50 flex min-h-full w-full select-none items-center justify-center bg-gradient-to-b from-black/15 to-transparent transition-opacity",
              blur && "bg-black/50 lg:bg-transparent lg:backdrop-blur-[2px]"
            )}
            ref={ref}
          >
            <div
              className={clsx(
                "min-h-[inherit] rounded border border-white/30 bg-neutral-900 bg-opacity-[0.98] text-white shadow-lg drop-shadow-lg lg:backdrop-blur-sm",
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

export function ModalHeader({
  linkTo,
  onClose,
  title
}: {
  linkTo?: string;
  onClose?: () => void;
  title: string;
}) {
  return (
    <div className="select-none bg-gradient-to-t from-black/30 to-transparent px-1 py-1 pr-2">
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-500/30 to-transparent py-1 pl-2">
        <span className="font-display text-[0.9rem] font-bold text-neutral-200">
          {title}
        </span>
        <div className="flex items-center">
          {linkTo !== undefined && (
            <Link
              className="h-4 px-2 opacity-50 transition hover:opacity-100"
              to={linkTo}
            >
              <FontAwesomeIcon icon={faXmark} className="block h-4 w-4" />
            </Link>
          )}
          {onClose !== undefined && (
            <button
              className="h-4 cursor-default px-2 opacity-50 transition hover:opacity-100"
              onClick={onClose}
            >
              <FontAwesomeIcon icon={faXmark} className="block h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
