/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps, PointerEvent, useRef, useState } from "react";
import { getSoundProps } from "~/interface-sounds";
import { playSound, SoundHandle } from "~/sound.client";
import { ModalButton } from "./modal-button";
import { TooltipBubble, useTooltip } from "./tooltip";

const DEFAULT_HOLD_MS = 2500;
const REWIND_MS = 150;

export function HoldButton({
  children,
  durationMs = DEFAULT_HOLD_MS,
  onHold,
  tooltip,
  variant = "danger",
  ...props
}: Omit<ComponentProps<typeof ModalButton>, "variant"> & {
  durationMs?: number;
  onHold: () => void;
  tooltip?: string;
  variant?: "danger" | "primary";
}) {
  const [holding, setHolding] = useState(false);
  const fireRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loopRef = useRef<SoundHandle | undefined>(undefined);

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
    loopRef.current?.stop();
    loopRef.current = playSound("laptop_button_fill_loop", { loop: true });
  }

  function stopLoop() {
    loopRef.current?.stop();
    loopRef.current = undefined;
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
        {...getSoundProps({ press: "none" })}
        {...getReferenceProps({
          onPointerCancel: cancel,
          onPointerDown: start,
          onPointerLeave: cancel,
          onPointerUp: cancel
        })}
        className={clsx("overflow-hidden", props.className)}
        forwardRef={setReference}
        variant={variant}
      >
        <span
          aria-hidden
          className={clsx(
            "absolute inset-y-0 left-0",
            variant === "danger" ? "bg-red-400" : "bg-green-400"
          )}
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
