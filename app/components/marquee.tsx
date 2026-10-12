/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";

const HOLD_START_MS = 1000;
const SLIDE_MS_PER_LETTER = 50;
const HOLD_END_MS = 400;
const FADE_MS = 200;
const EASE = [
  [0, 0],
  [0.1, 0.095],
  [0.2, 0.295],
  [0.3, 0.513],
  [0.4, 0.683],
  [0.5, 0.802],
  [0.6, 0.885],
  [0.7, 0.941],
  [0.8, 0.976],
  [0.9, 0.994],
  [1, 1]
];

function getAnimation(length: number) {
  const slideEnd = HOLD_START_MS + length * SLIDE_MS_PER_LETTER;
  const fadeOut = slideEnd + HOLD_END_MS;
  const duration = fadeOut + FADE_MS;
  function ease(from: number, to: number, start: number, end: number) {
    return EASE.map(([time, progress]) => {
      const value = from + (to - from) * progress;
      const at = ((start + (end - start) * time) / duration) * 100;
      return `${value.toFixed(3)} ${at.toFixed(2)}%`;
    }).join(", ");
  }
  return {
    animationDuration: `${duration}ms`,
    animationTimingFunction: [
      `linear(0, ${ease(0, 1, HOLD_START_MS, slideEnd)}, 1)`,
      `linear(${ease(0, 1, 0, FADE_MS)}, ${ease(1, 0, fadeOut, duration)})`
    ].join(", ")
  };
}

export function Marquee({
  children,
  className,
  textClassName
}: {
  children: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span
      className={clsx(
        "@container block min-w-0 flex-1 overflow-x-clip text-left whitespace-nowrap",
        className
      )}
    >
      <span
        className={clsx("marquee inline-block", textClassName)}
        style={getAnimation(children.length)}
      >
        {children}
      </span>
    </span>
  );
}

// Takes the width of its text, up to the max width it is given, while
// `Marquee` takes no room of its own and fills what its parent gives it.
export function FitMarquee({
  children,
  className,
  textClassName
}: {
  children: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={clsx("grid", className)}>
      <span
        className={clsx(
          "invisible col-start-1 row-start-1 truncate",
          textClassName
        )}
      >
        {children}
      </span>
      <Marquee
        className="col-start-1 row-start-1"
        textClassName={textClassName}
      >
        {children}
      </Marquee>
    </span>
  );
}
