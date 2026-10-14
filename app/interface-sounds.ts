/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { isSoundName, SoundName } from "./sound-events";
import { initSounds, playSound } from "./sound.client";

/** Like Panorama's `sound` style property, but for `:hover` and `:active`. */
export function getSoundProps({
  hover,
  press
}: {
  hover?: SoundName | "none";
  press?: SoundName | "none";
}) {
  return { "data-sound-hover": hover, "data-sound-press": press };
}

function isDisabled(element: Element) {
  return element instanceof HTMLButtonElement && element.disabled;
}

function getDeclaredSound(element: Element, attribute: string) {
  const value = element.getAttribute(attribute);
  return value !== null && isSoundName(value) ? value : undefined;
}

function getHoverSound(element: Element) {
  if (isDisabled(element)) {
    return undefined;
  }
  if (element.hasAttribute("data-sound-hover")) {
    return getDeclaredSound(element, "data-sound-hover");
  }
  return element instanceof HTMLButtonElement
    ? "generic_button_rollover"
    : undefined;
}

/**
 * Sounds of the elements that `target` puts under `:hover` when the pointer
 * comes from `previous`; ancestors already hovered stay silent.
 */
export function resolveHoverSounds(target: Element, previous: Element | null) {
  const sounds = new Set<SoundName>();
  for (
    let element: Element | null = target;
    element !== null && !element.contains(previous);
    element = element.parentElement
  ) {
    const sound = getHoverSound(element);
    if (sound !== undefined) {
      sounds.add(sound);
    }
  }
  return [...sounds];
}

export function resolvePressSound(target: Element) {
  const element = target.closest("a[href], button, [data-sound-press]");
  if (element === null || isDisabled(element)) {
    return undefined;
  }
  if (element.hasAttribute("data-sound-press")) {
    return getDeclaredSound(element, "data-sound-press");
  }
  return "generic_button_press";
}

export function resolveKeyPressSound(target: Element, key: string) {
  const isActivation =
    target instanceof HTMLButtonElement
      ? key === "Enter" || key === " "
      : target instanceof HTMLAnchorElement
        ? key === "Enter" && target.hasAttribute("href")
        : target instanceof HTMLInputElement &&
          target.type === "checkbox" &&
          key === " ";
  return isActivation ? resolvePressSound(target) : undefined;
}

export function installInterfaceSounds() {
  function handlePointerOver(event: PointerEvent) {
    if (event.pointerType !== "mouse" || !(event.target instanceof Element)) {
      return;
    }
    const previous =
      event.relatedTarget instanceof Element ? event.relatedTarget : null;
    for (const sound of resolveHoverSounds(event.target, previous)) {
      playSound(sound);
    }
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.button !== 0 || !(event.target instanceof Element)) {
      return;
    }
    const sound = resolvePressSound(event.target);
    if (sound !== undefined) {
      playSound(sound);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.repeat || !(event.target instanceof Element)) {
      return;
    }
    const sound = resolveKeyPressSound(event.target, event.key);
    if (sound !== undefined) {
      playSound(sound);
    }
  }

  const disposeSounds = initSounds();
  document.addEventListener("pointerover", handlePointerOver, true);
  document.addEventListener("pointerdown", handlePointerDown, true);
  document.addEventListener("keydown", handleKeyDown, true);
  return () => {
    disposeSounds();
    document.removeEventListener("pointerover", handlePointerOver, true);
    document.removeEventListener("pointerdown", handlePointerDown, true);
    document.removeEventListener("keydown", handleKeyDown, true);
  };
}
