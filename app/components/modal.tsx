import clsx from "clsx";
import { ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({
  className,
  children,
  portal
}: {
  className?: string;
  children: ReactNode;
  portal?: boolean;
}) {
  const modal = (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
      <div
        className={clsx(
          "shadow-lg rounded bg-neutral-900/80 text-white backdrop-blur-sm drop-shadow-lg",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
  if (portal) {
    return createPortal(modal, document.body);
  }
  return modal;
}
