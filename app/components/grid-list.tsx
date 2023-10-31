/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { MouseEvent, ReactNode, useEffect, useRef, useState, WheelEvent } from "react";
import { range } from "~/utils/number";

export function GridList({
  children,
  hideScrollbar,
  itemHeight,
  maxItemsIntoView = 6
}: {
  children: ReactNode[];
  hideScrollbar?: boolean;
  itemHeight: number;
  maxItemsIntoView?: number;
}) {
  const [scrollbarHeight, setScrollbarHeight] = useState(0);
  const [scrollbarTop, setScrollbarTop] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollable = useRef<HTMLDivElement>(null);
  const scrollbar = useRef<HTMLDivElement>(null);
  const currentIndex = scrollTop / itemHeight;
  const scrollableHeight = maxItemsIntoView * itemHeight;
  const maxScrollTop = (children.length - maxItemsIntoView) * itemHeight;

  function handleScroll(deltaY: number) {
    if (!scrollable.current) {
      return;
    }
    const direction = deltaY > 0 ? 1 : -1;
    setScrollTop((current) =>
      Math.min(Math.max(current + itemHeight * direction, 0), maxScrollTop)
    );
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    handleScroll(event.deltaY);
  }

  function handleScrollbarClick(event: MouseEvent<HTMLDivElement>) {
    if (!scrollbar.current) {
      return;
    }
    const scrollbarHeight = scrollbar.current.clientHeight;
    const isMoveDown = event.nativeEvent.offsetY > scrollbarHeight / 2;
    handleScroll(isMoveDown ? 1 : -1);
  }

  const updateScrollbar = () => {
    if (!scrollable.current || !scrollbar.current) {
      return;
    }
    const scrollableMaxHeight = children.length * itemHeight;
    const scrollbarHeight = scrollbar.current.clientHeight;
    const height = scrollableMaxHeight > 0
      ? (scrollbarHeight * scrollableHeight) / scrollableMaxHeight
      : 0;
    const top = Math.max(
      ((scrollbarHeight - height) * scrollTop) / maxScrollTop,
      0
    );
    setScrollbarHeight(height);
    setScrollbarTop(top);
  };

  useEffect(() => {
    updateScrollbar();
  }, []);

  useEffect(() => {
    updateScrollbar();
  }, [scrollTop]);

  useEffect(() => {
    setScrollTop(0);
    updateScrollbar();
  }, [children]);

  return (
    <div className="relative">
      <div
        className="overflow-hidden px-2"
        style={{
          height: itemHeight * (maxItemsIntoView || 2)
        }}
        onWheel={handleWheel}
        ref={scrollable}
      >
        {range(maxItemsIntoView).map((index) => children[currentIndex + index])}
      </div>
      <div
        className="absolute right-0 top-0 h-full w-2"
        onClick={handleScrollbarClick}
        ref={scrollbar}
      >
        <div className="relative h-full w-1/2 overflow-hidden">
          <div
            className={clsx(
              "absolute w-full bg-white/30 rounded",
              (hideScrollbar || children.length === 0) && "opacity-0"
            )}
            style={{
              height: scrollbarHeight,
              top: scrollbarTop || 0
            }}
          />
        </div>
      </div>
    </div>
  );
}
