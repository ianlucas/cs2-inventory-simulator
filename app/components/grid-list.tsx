/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import {
  ElementRef,
  MouseEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
  WheelEvent
} from "react";
import { range } from "~/utils/number";
import { useTranslate } from "./app-context";
import { InfoIcon } from "./info-icon";

export function GridList<T>({
  children,
  className,
  items,
  hideScrollbar,
  itemHeight,
  maxItemsIntoView = 6
}: {
  children: (item: T, index: number) => ReactNode;
  className?: string;
  items: T[];
  hideScrollbar?: boolean;
  itemHeight: number;
  maxItemsIntoView?: number;
}) {
  const translate = useTranslate();

  const [scrollbarHeight, setScrollbarHeight] = useState(0);
  const [scrollbarTop, setScrollbarTop] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const scrollable = useRef<ElementRef<"div">>(null);
  const scrollbar = useRef<ElementRef<"div">>(null);
  const currentIndex = scrollTop / itemHeight;
  const scrollableHeight = maxItemsIntoView * itemHeight;
  const maxScrollTop = (items.length - maxItemsIntoView) * itemHeight;

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
    const scrollableMaxHeight = items.length * itemHeight;
    const scrollbarHeight = scrollbar.current.clientHeight;
    const height =
      scrollableMaxHeight > 0
        ? (scrollbarHeight * scrollableHeight) / scrollableMaxHeight
        : 0;
    const top = Math.max(
      ((scrollbarHeight - height) * scrollTop) / maxScrollTop,
      0
    );
    setScrollbarHeight(height);
    setScrollbarTop(top);
  };

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    setTouchStartY(event.touches[0].clientY);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const deltaY = event.touches[0].clientY - touchStartY;
    handleScroll(-deltaY);
  }

  function handleTouchEnd() {
    setTouchStartY(0);
  }

  function handleMouseDown() {
    setIsDragging(true);
  }

  function handleMouseMove(event: globalThis.MouseEvent) {
    if (isDragging && scrollbar.current) {
      event.preventDefault();
      const scrollbarHeight = scrollbar.current.clientHeight;
      const mouseY =
        event.clientY - scrollbar.current.getBoundingClientRect().top;
      const clamped = Math.min(
        Math.max((mouseY / scrollbarHeight) * maxScrollTop, 0),
        maxScrollTop
      );
      let scrollTop = 0;
      while (scrollTop < maxScrollTop && clamped >= scrollTop + itemHeight) {
        scrollTop += itemHeight;
      }
      setScrollTop(scrollTop);
    }
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  useEffect(() => {
    updateScrollbar();
  }, []);

  useEffect(() => {
    updateScrollbar();
  }, [scrollTop]);

  useEffect(() => {
    setScrollTop(0);
    updateScrollbar();
  }, [items]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="relative">
      <div
        className={clsx("touch-none overflow-hidden", className)}
        style={{
          height: itemHeight * (maxItemsIntoView || 2)
        }}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
        ref={scrollable}
      >
        {items.length === 0 && (
          <div
            className="flex items-center justify-center gap-2 bg-linear-to-r from-transparent via-black/30 to-transparent select-none"
            style={{ height: itemHeight }}
          >
            <InfoIcon className="h-4" />
            {translate("GridItemNoItemsToDisplay")}
          </div>
        )}
        {range(maxItemsIntoView).map((index) => {
          const item = items[currentIndex + index];
          return item !== undefined
            ? children(item, currentIndex + index)
            : null;
        })}
      </div>
      <div
        className="absolute top-0 right-0 h-full w-2"
        onClick={handleScrollbarClick}
        onMouseDown={handleMouseDown}
        ref={scrollbar}
      >
        <div className="relative h-full w-1/2 overflow-hidden">
          <div
            className={clsx(
              "absolute w-full rounded-sm bg-white/30",
              (hideScrollbar ||
                items.length === 0 ||
                items.length <= maxItemsIntoView) &&
                "opacity-0"
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
