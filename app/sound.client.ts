/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  isSoundName,
  SOUND_EVENTS,
  SoundEvent,
  SoundName
} from "./sound-events";
import { getAppVolume } from "./user-storage";

export interface SoundHandle {
  stop: () => void;
}

const UNLOCK_EVENTS = ["keydown", "mousedown", "pointerup", "touchend"];

let context: AudioContext | undefined;
let hasInteracted = false;
const downloads = new Map<string, Promise<ArrayBuffer>>();
const buffers = new Map<string, Promise<AudioBuffer>>();
const blockedUntil = new Map<SoundName, number>();
const instances = new Map<SoundName, SoundHandle[]>();

function hasUserActivation() {
  return "userActivation" in navigator
    ? navigator.userActivation.hasBeenActive
    : hasInteracted;
}

function download(file: string) {
  let bytes = downloads.get(file);
  if (bytes === undefined) {
    bytes = fetch(`/sounds/${file}`).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to download sound ${file}.`);
      }
      return response.arrayBuffer();
    });
    downloads.set(file, bytes);
    bytes.catch(() => downloads.delete(file));
  }
  return bytes;
}

function decode(context: AudioContext, file: string) {
  let buffer = buffers.get(file);
  if (buffer === undefined) {
    buffer = download(file).then((bytes) => {
      // Decoding detaches the bytes, so they can't be reused.
      downloads.delete(file);
      return context.decodeAudioData(bytes);
    });
    buffers.set(file, buffer);
    buffer.catch(() => buffers.delete(file));
  }
  return buffer;
}

function getPreloadFiles() {
  return Object.values<SoundEvent>(SOUND_EVENTS)
    .filter(({ preload }) => preload === true)
    .map(({ file }) => file);
}

// Browsers warn when a context is created before the user interacts with the
// page, so until then sounds are skipped.
function getContext() {
  if (context === undefined) {
    if (!hasUserActivation()) {
      return undefined;
    }
    context = new AudioContext();
    for (const file of getPreloadFiles()) {
      decode(context, file).catch(() => {});
    }
  }
  if (context.state !== "running") {
    context.resume().catch(() => {});
  }
  return context;
}

function preloadSounds() {
  for (const file of getPreloadFiles()) {
    (context !== undefined ? decode(context, file) : download(file)).catch(
      () => {}
    );
  }
}

function whenIdle(callback: () => void) {
  // Not every browser has `requestIdleCallback`.
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback);
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, 1000);
  return () => window.clearTimeout(handle);
}

/** Starts audio on the first user gesture and preloads sounds while idle. */
export function initSounds() {
  function unlock(event: Event) {
    if (event instanceof KeyboardEvent && event.key === "Escape") {
      return;
    }
    hasInteracted = true;
    getContext();
  }
  for (const type of UNLOCK_EVENTS) {
    window.addEventListener(type, unlock, { capture: true });
  }
  const cancelPreload = whenIdle(preloadSounds);
  return () => {
    for (const type of UNLOCK_EVENTS) {
      window.removeEventListener(type, unlock, { capture: true });
    }
    cancelPreload();
  };
}

export function playSound(
  name: SoundName,
  { loop = false }: { loop?: boolean } = {}
): SoundHandle {
  const context = getContext();
  const now = performance.now();
  if (context === undefined || now < (blockedUntil.get(name) ?? 0)) {
    return { stop: () => undefined };
  }
  const event: SoundEvent = SOUND_EVENTS[name];
  if (event.blockDuration !== undefined) {
    blockedUntil.set(name, now + event.blockDuration * 1000);
  }
  const playing = instances.get(name) ?? [];
  instances.set(name, playing);
  if (event.instanceLimit !== undefined) {
    while (playing.length >= event.instanceLimit) {
      playing[0].stop();
    }
  }

  let source: AudioBufferSourceNode | undefined;
  let stopped = false;
  const instance: SoundHandle = {
    stop() {
      if (stopped) {
        return;
      }
      stopped = true;
      playing.splice(playing.indexOf(instance), 1);
      source?.stop();
    }
  };
  playing.push(instance);

  decode(context, event.file)
    .then((buffer) => {
      if (stopped) {
        return;
      }
      const gain = context.createGain();
      gain.gain.value = (event.volume ?? 1) * getAppVolume();
      gain.connect(context.destination);
      source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = loop;
      source.playbackRate.value = event.pitch ?? 1;
      source.connect(gain);
      source.addEventListener("ended", () => {
        instance.stop();
        gain.disconnect();
      });
      source.start(context.currentTime + (event.delay ?? 0));
    })
    .catch(() => instance.stop());

  const children = (event.children ?? [])
    .filter(isSoundName)
    .map((child) => playSound(child));
  return {
    stop() {
      instance.stop();
      for (const child of children) {
        child.stop();
      }
    }
  };
}
