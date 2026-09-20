/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { claimTabLock } from "./tab-leader";

export const ICON_GENERATOR_LOCK = "cs2-inventory-simulator:icon-generator";

export type IconGeneratorRole =
  "unclaimed" | "claiming" | "generator" | "bystander";

const listeners = new Set<() => void>();
const wantedListeners = new Set<() => void>();

let role: IconGeneratorRole = "unclaimed";
let wanted = false;
let paused = 0;
let watchingVisibility = false;
let resumeWhenVisible: (() => void) | undefined;

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeIconGeneratorRole(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getIconGeneratorRole(): IconGeneratorRole {
  return role;
}

export function isIconGenerationPaused(): boolean {
  return paused > 0;
}

export function isIconGeneratorWanted(): boolean {
  return wanted;
}

export function isIconGeneratorWantedServer(): boolean {
  return false;
}

export function subscribeIconGeneratorWanted(listener: () => void): () => void {
  wantedListeners.add(listener);
  return () => wantedListeners.delete(listener);
}

export function setIconGeneratorWanted(next: boolean): void {
  if (wanted === next) {
    return;
  }
  wanted = next;
  for (const listener of wantedListeners) {
    listener();
  }
}

export function pauseIconGeneration(): () => void {
  paused++;
  emit();
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    paused--;
    emit();
  };
}

function watchTabVisibility(): void {
  if (watchingVisibility || typeof document === "undefined") {
    return;
  }
  watchingVisibility = true;
  function syncWithVisibility(): void {
    if (document.visibilityState === "hidden") {
      resumeWhenVisible ??= pauseIconGeneration();
      return;
    }
    const resume = resumeWhenVisible;
    resumeWhenVisible = undefined;
    resume?.();
  }
  document.addEventListener("visibilitychange", syncWithVisibility);
  syncWithVisibility();
}

function setRole(next: IconGeneratorRole): void {
  if (role === next) {
    return;
  }
  role = next;
  if (next === "generator") {
    watchTabVisibility();
  }
  emit();
}

export function claimIconGeneratorRole(): void {
  if (role !== "unclaimed") {
    return;
  }
  setRole("claiming");
  void claimTabLock(ICON_GENERATOR_LOCK, {
    onGranted: () => setRole("generator")
  }).then((granted) => setRole(granted ? "generator" : "bystander"));
}
