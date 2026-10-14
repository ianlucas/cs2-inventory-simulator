/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useMergeRefs } from "@floating-ui/react";
import clsx from "clsx";
import { ComponentProps, useEffect, useRef } from "react";
import { getSoundProps } from "~/interface-sounds";

// Panorama's `UpdateElement` keyframes, added on top of the button's own
// filter and transform so the hover brightness and disabled wash stay under it.
const PULSE_KEYFRAMES: Keyframe[] = [
  { filter: "brightness(1)", transform: "scale(1)" },
  { filter: "brightness(2)", transform: "scale(1.2)" },
  { filter: "brightness(1)", transform: "scale(1)" }
];

const PULSE_OPTIONS: KeyframeAnimationOptions = {
  composite: "add",
  duration: 250,
  easing: "ease-in-out"
};

export function ModalButton({
  children,
  className,
  forwardRef,
  pulseOnToggle,
  variant,
  ...props
}: ComponentProps<"button"> & {
  forwardRef?: typeof props.ref;
  /** Pulses when `disabled` changes, like Panorama's `popup-capability-update-anim`. */
  pulseOnToggle?: boolean;
  /** Omit to style it from `className`, like `HoldButton`. */
  variant?: "primary" | "secondary" | "apply" | "tertiary";
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const mergedRef = useMergeRefs([ref, forwardRef]);
  const disabled = props.disabled === true;
  const disabledRef = useRef(disabled);
  const pulseRef = useRef<Animation | undefined>(undefined);

  useEffect(() => {
    if (disabledRef.current === disabled) {
      return;
    }
    disabledRef.current = disabled;
    if (pulseOnToggle && ref.current !== null) {
      pulseRef.current?.cancel();
      pulseRef.current = ref.current.animate(PULSE_KEYFRAMES, PULSE_OPTIONS);
    }
  }, [disabled, pulseOnToggle]);

  return (
    <button
      className={clsx([
        className,
        "font-display pointer-events-auto relative flex h-9 cursor-default items-center rounded-[3px] px-3 text-white font-stretch-[62.5%] disabled:brightness-60 disabled:grayscale",
        // `.PopupButton.Positive`
        variant === "primary" &&
          "bg-[#0F9D58] font-medium uppercase transition-[background-color,filter] duration-100 ease-in-out enabled:hover:brightness-140 enabled:hover:duration-0",
        // `.PopupButton`
        variant === "secondary" && "modal-button-hover font-medium uppercase",
        // `.popup-can-apply-button`
        variant === "apply" &&
          "bg-[#0F9D58] font-bold transition-[background-color,filter] duration-200 ease-in-out enabled:hover:brightness-150",
        // `.popup-can-apply-button--cancel` and `--next`
        variant === "tertiary" &&
          "animate-modal-button-slide-in border border-white/60 bg-black/20 font-bold enabled:hover:bg-black/72"
      ])}
      {...getSoundProps({ press: "submenu_select" })}
      {...props}
      ref={mergedRef}
    >
      {children}
    </button>
  );
}
