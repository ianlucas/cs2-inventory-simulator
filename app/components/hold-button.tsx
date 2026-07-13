/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps, PointerEvent, useRef, useState } from "react";
import { getTypedFromLocalStorage } from "~/utils/localstorage";
import { ModalButton } from "./modal-button";
import { TooltipBubble, useTooltip } from "./tooltip";

const DEFAULT_HOLD_MS = 2500;
const REWIND_MS = 150;

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

  const {
    getReferenceProps,
    setReference,
    tooltip: bubble
  } = useTooltip({
    durationMs: 200,
    offsetPx: 20,
    placement: "top"
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
        forwardRef={setReference}
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
      <TooltipBubble {...bubble} multiline>
        {tooltip}
      </TooltipBubble>
    </>
  );
}
