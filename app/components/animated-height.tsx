/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ReactNode, useLayoutEffect, useRef, useState } from "react";

export function AnimatedHeight({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<number>(undefined);
  const [height, setHeight] = useState<number>();
  const [isAnimating, setIsAnimating] = useState(false);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (content === null) {
      return;
    }
    const update = () => {
      const next = content.offsetHeight;
      if (heightRef.current !== undefined && heightRef.current !== next) {
        setIsAnimating(true);
      }
      heightRef.current = next;
      setHeight(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={clsx(
        "transition-[height] duration-250 ease-out",
        isAnimating && "overflow-hidden",
        className
      )}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget) {
          setIsAnimating(false);
        }
      }}
      style={{ height }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
