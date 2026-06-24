/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles
} from "@floating-ui/react";
import clsx from "clsx";
import { ComponentProps, PointerEvent, useRef, useState } from "react";
import { getTypedFromLocalStorage } from "~/utils/localstorage";
import { ModalButton } from "./modal-button";

// How long the button must be held before it fires; the reddish fill sweeps to full
// over this window with the loop cue underneath.
const DEFAULT_HOLD_MS = 2500;
// Snap-back when released early — fast, so a cancelled hold reads as "let go".
const REWIND_MS = 150;

/**
 * Press-and-hold button mirroring the game's destructive confirm: holding sweeps a
 * fill across the button and plays a looping cue; completing the hold fires `onHold`,
 * releasing (or leaving) early cancels — the fill rewinds and the cue stops. A tooltip
 * explains the gesture (rendered with `pre-line` so the source `\n` breaks).
 */
export function HoldButton({
  children,
  durationMs = DEFAULT_HOLD_MS,
  onHold,
  tooltip,
  ...props
}: Omit<ComponentProps<typeof ModalButton>, "variant"> & {
  durationMs?: number;
  onHold: () => void;
  tooltip?: string;
}) {
  const [holding, setHolding] = useState(false);
  const fireRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loopRef = useRef<HTMLAudioElement | undefined>(undefined);

  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    middleware: [
      offset(20),
      flip({ fallbackAxisSideDirection: "start" }),
      shift()
    ],
    onOpenChange: setIsOpen,
    open: isOpen,
    placement: "top",
    whileElementsMounted: autoUpdate
  });
  const hover = useHover(context, { move: false });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
    role
  ]);
  const { isMounted, styles } = useTransitionStyles(context, {
    duration: 200,
    initial: { opacity: 0 }
  });

  function startLoop() {
    if (typeof Audio === "undefined") {
      return;
    }
    const loop = (loopRef.current ??= new Audio(
      "/sounds/laptop_button_fill_loop_01.wav"
    ));
    loop.loop = true;
    loop.volume = getTypedFromLocalStorage("appVolume", 1);
    loop.currentTime = 0;
    void loop.play().catch(() => {});
  }

  function stopLoop() {
    const loop = loopRef.current;
    if (loop !== undefined) {
      loop.pause();
      loop.currentTime = 0;
    }
  }

  function cancel() {
    if (fireRef.current !== undefined) {
      clearTimeout(fireRef.current);
      fireRef.current = undefined;
    }
    stopLoop();
    setHolding(false);
  }

  function start(event: PointerEvent<HTMLButtonElement>) {
    // Ignore non-primary buttons and re-entrant presses so the fill tracks one hold.
    if (props.disabled === true || fireRef.current !== undefined) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    setHolding(true);
    startLoop();
    fireRef.current = setTimeout(() => {
      fireRef.current = undefined;
      stopLoop();
      setHolding(false);
      onHold();
    }, durationMs);
  }

  return (
    <>
      <ModalButton
        {...props}
        {...getReferenceProps({
          onPointerCancel: cancel,
          onPointerDown: start,
          onPointerLeave: cancel,
          onPointerUp: cancel
        })}
        className={clsx("overflow-hidden", props.className)}
        forwardRef={refs.setReference}
        variant="danger"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-red-400"
          style={{
            transitionDuration: `${holding ? durationMs : REWIND_MS}ms`,
            transitionProperty: "width",
            transitionTimingFunction: "linear",
            width: holding ? "100%" : "0%"
          }}
        />
        <span className="relative">{children}</span>
      </ModalButton>
      <FloatingPortal>
        {tooltip !== undefined && isOpen && isMounted && (
          <div
            className="z-80"
            ref={refs.setFloating}
            role="tooltip"
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <div
              className="max-w-xs rounded-sm bg-neutral-900/90 px-4 py-3.5 text-xs whitespace-pre-line text-neutral-200 shadow-sm"
              style={styles}
            >
              {tooltip}
            </div>
          </div>
        )}
      </FloatingPortal>
    </>
  );
}
