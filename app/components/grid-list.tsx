/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import {
  MouseEvent,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  WheelEvent
} from "react";
import { prefersReducedMotion } from "~/reduced-motion";
import { range } from "~/shared/number";
import { useTranslate } from "./app-context";
import { InfoIcon } from "./info-icon";

const SLIDE_OPTIONS: KeyframeAnimationOptions = {
  duration: 150,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)"
};

interface Position {
  from: number;
  top: number;
}

interface Slide extends Position {
  thumb?: Animation;
  track: Animation;
}

function slideOffset({ from, top, track }: Slide) {
  const progress = track.effect?.getComputedTiming().progress;
  return progress === null || progress === undefined
    ? undefined
    : from + (top - from) * progress;
}

function stopSlide({ thumb, track }: Slide) {
  track.cancel();
  thumb?.cancel();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function translateY(offset: number) {
  return `translateY(${offset}px)`;
}

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

  const [position, setPosition] = useState<Position>({ from: 0, top: 0 });
  const [touchStartY, setTouchStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const scrollable = useRef<HTMLDivElement>(null);
  const scrollbar = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const slide = useRef<Slide>(null);
  const renderedTop = useRef(0);
  const pendingTop = useRef(0);

  const viewportHeight = itemHeight * (maxItemsIntoView || 2);
  const scrollableHeight = maxItemsIntoView * itemHeight;
  const contentHeight = items.length * itemHeight;
  const maxScrollTop = Math.max(contentHeight - scrollableHeight, 0);
  const thumbHeight =
    contentHeight > 0 ? (viewportHeight * scrollableHeight) / contentHeight : 0;
  const lowestTop = Math.min(position.from, position.top);
  const highestTop = Math.max(position.from, position.top);
  const firstIndex = Math.floor(lowestTop / itemHeight);
  const lastIndex = Math.ceil(highestTop / itemHeight) + maxItemsIntoView;

  function thumbOffset(top: number) {
    return maxScrollTop > 0
      ? ((viewportHeight - thumbHeight) * top) / maxScrollTop
      : 0;
  }

  function currentOffset() {
    const offset =
      slide.current === null ? undefined : slideOffset(slide.current);
    return offset ?? renderedTop.current;
  }

  function scrollTo(next: number) {
    const top = clamp(next, 0, maxScrollTop);
    if (top === pendingTop.current) {
      return;
    }
    const offset = currentOffset();
    const shouldSlide =
      !prefersReducedMotion() && Math.abs(top - offset) <= scrollableHeight;
    pendingTop.current = top;
    setPosition({ from: shouldSlide ? offset : top, top });
  }

  function handleScroll(deltaY: number) {
    if (!scrollable.current) {
      return;
    }
    const direction = deltaY > 0 ? 1 : -1;
    scrollTo(pendingTop.current + itemHeight * direction);
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
      let top = 0;
      while (top < maxScrollTop && clamped >= top + itemHeight) {
        top += itemHeight;
      }
      scrollTo(top);
    }
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  useLayoutEffect(() => {
    const previous = slide.current;
    const offset = previous === null ? undefined : slideOffset(previous);
    if (previous !== null) {
      stopSlide(previous);
    }
    slide.current = null;
    renderedTop.current = position.top;
    if (position.from === position.top || track.current === null) {
      return;
    }
    const from = clamp(offset ?? position.from, lowestTop, highestTop);
    const current: Slide = {
      from,
      top: position.top,
      track: track.current.animate(
        [
          { transform: translateY(-from) },
          { transform: translateY(-position.top) }
        ],
        SLIDE_OPTIONS
      ),
      thumb: isDragging
        ? undefined
        : thumb.current?.animate(
            [
              { transform: translateY(thumbOffset(from)) },
              { transform: translateY(thumbOffset(position.top)) }
            ],
            SLIDE_OPTIONS
          )
    };
    current.track.onfinish = () =>
      setPosition((latest) =>
        latest === position ? { from: latest.top, top: latest.top } : latest
      );
    slide.current = current;
  }, [position]);

  useLayoutEffect(
    () => () => {
      if (slide.current !== null) {
        stopSlide(slide.current);
      }
    },
    []
  );

  useEffect(() => {
    pendingTop.current = 0;
    setPosition({ from: 0, top: 0 });
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
        style={{ height: viewportHeight }}
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
        <div
          ref={track}
          style={{
            paddingTop: firstIndex * itemHeight,
            transform: translateY(-position.top)
          }}
        >
          {range(lastIndex - firstIndex, firstIndex).map((index) => {
            const item = items[index];
            return item !== undefined ? children(item, index) : null;
          })}
        </div>
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
              "absolute top-0 w-full rounded-sm bg-white/30",
              (hideScrollbar ||
                items.length === 0 ||
                items.length <= maxItemsIntoView) &&
                "opacity-0"
            )}
            ref={thumb}
            style={{
              height: thumbHeight,
              transform: translateY(thumbOffset(position.top))
            }}
          />
        </div>
      </div>
    </div>
  );
}
