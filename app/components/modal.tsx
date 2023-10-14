import clsx from "clsx";
import { ReactNode } from "react";

export function Modal({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
      <div
        className={clsx(
          "shadow-lg rounded bg-neutral-900/70 text-white backdrop-blur-sm",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
