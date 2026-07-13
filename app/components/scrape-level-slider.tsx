/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_MAX_STICKER_WEAR,
  CS2_MIN_STICKER_WEAR,
  CS2_STICKER_WEAR_FACTOR
} from "@ianlucas/cs2-lib";
import { useEffect, useRef } from "react";
import { getTypedFromLocalStorage } from "~/utils/localstorage";

const SCRATCH_THROTTLE_MS = 500;

export function ScrapeLevelSlider({
  disabled,
  max = CS2_MAX_STICKER_WEAR,
  min = CS2_MIN_STICKER_WEAR,
  onChange,
  value
}: {
  disabled?: boolean;
  max?: number;
  min?: number;
  onChange: (wear: number) => void;
  value: number;
}) {
  const scratchRef = useRef<HTMLAudioElement | undefined>(undefined);
  const draggingRef = useRef(false);
  const prevValueRef = useRef(value);
  const lastScratchRef = useRef(0);

  useEffect(() => {
    const previous = prevValueRef.current;
    prevValueRef.current = value;
    if (!draggingRef.current || value === previous) {
      return;
    }
    const now = Date.now();
    if (now - lastScratchRef.current < SCRATCH_THROTTLE_MS) {
      return;
    }
    lastScratchRef.current = now;
    if (typeof Audio === "undefined") {
      return;
    }
    const scratch = (scratchRef.current ??= new Audio(
      "/sounds/sticker_scratch1.wav"
    ));
    scratch.volume = getTypedFromLocalStorage("appVolume", 1);
    scratch.currentTime = 0;
    void scratch.play().catch(() => {});
  }, [value]);

  function stopScratching() {
    draggingRef.current = false;
    lastScratchRef.current = 0;
    const scratch = scratchRef.current;
    if (scratch !== undefined) {
      scratch.pause();
      scratch.currentTime = 0;
    }
  }

  useEffect(() => {
    return () => {
      scratchRef.current?.pause();
    };
  }, []);

  const filled =
    max > min
      ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
      : 100;

  return (
    <div className="pointer-events-auto relative h-3 w-32">
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-[3px] bg-black/40" />
      <div
        className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-[3px] bg-[#d0bfbf98]"
        style={{ width: `${filled}%` }}
      />
      <input
        className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-default [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-xs [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[1px_1px_4px_1px_#00000050] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-xs [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[1px_1px_4px_1px_#00000050]"
        disabled={disabled}
        max={max}
        min={min}
        onBlur={stopScratching}
        onChange={(event) => onChange(Number(event.target.value))}
        // Pointer only, like the game; keep Tab.
        onKeyDown={(event) => {
          if (event.key !== "Tab") {
            event.preventDefault();
          }
        }}
        onPointerCancel={stopScratching}
        onPointerDown={() => {
          draggingRef.current = true;
        }}
        onPointerUp={stopScratching}
        step={CS2_STICKER_WEAR_FACTOR}
        type="range"
        value={value}
      />
    </div>
  );
}
