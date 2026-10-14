/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

class FakeGain {
  gain = { value: 1 };
  connect(node: unknown) {
    return node;
  }
  disconnect() {}
}

class FakeSource {
  buffer?: { url: string };
  loop = false;
  output?: FakeGain;
  playbackRate = { value: 1 };
  start = vi.fn();
  stop = vi.fn(() => this.onEnded?.());
  private onEnded?: () => void;
  addEventListener(_type: "ended", listener: () => void) {
    this.onEnded = listener;
  }
  connect(node: FakeGain) {
    this.output = node;
    return node;
  }
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  currentTime = 10;
  destination = {};
  sources: FakeSource[] = [];
  state = "running";
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  createBufferSource() {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }
  createGain() {
    return new FakeGain();
  }
  async decodeAudioData(bytes: { url: string }) {
    return bytes;
  }
  async resume() {}
}

const activation = { hasBeenActive: true };
let now = 0;

function flush() {
  return new Promise((resolve) => setTimeout(resolve));
}

function getSources() {
  return FakeAudioContext.instances.flatMap(({ sources }) => sources);
}

function getSource(file: string) {
  const source = getSources().find(({ buffer }) => buffer?.url.endsWith(file));
  if (source === undefined) {
    throw new Error(`Nothing played ${file}.`);
  }
  return source;
}

async function importSounds() {
  vi.resetModules();
  return await import("./sound.client");
}

beforeEach(() => {
  FakeAudioContext.instances = [];
  activation.hasBeenActive = true;
  now = 0;
  window.localStorage.clear();
  Object.defineProperty(navigator, "userActivation", {
    configurable: true,
    get: () => activation
  });
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => ({
      ok: true,
      arrayBuffer: async () => ({ url })
    }))
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("playSound", () => {
  test("skips sounds until the user interacts with the page", async () => {
    activation.hasBeenActive = false;
    const { playSound } = await importSounds();
    playSound("generic_button_press");
    await flush();
    expect(FakeAudioContext.instances).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("applies the event's pitch and its volume times the app volume", async () => {
    window.localStorage.setItem("appVolume", "0.5");
    const { playSound } = await importSounds();
    playSound("generic_button_rollover");
    await flush();
    const source = getSource("ui/panorama/generic_scroll_01.wav");
    expect(source.playbackRate.value).toBe(1.4);
    expect(source.output?.gain.value).toBeCloseTo(0.05);
    expect(source.start).toHaveBeenCalledWith(10);
  });

  test("drops repeats within the block duration", async () => {
    const { playSound } = await importSounds();
    playSound("generic_button_press");
    now = 5;
    playSound("generic_button_press");
    await flush();
    expect(getSources()).toHaveLength(1);
    now = 15;
    playSound("generic_button_press");
    await flush();
    expect(getSources()).toHaveLength(2);
  });

  test("stops the oldest instance past the instance limit", async () => {
    const { playSound } = await importSounds();
    playSound("inventory_item_rollover");
    await flush();
    const [first] = getSources();
    now = 20;
    playSound("inventory_item_rollover");
    await flush();
    expect(first.stop).toHaveBeenCalled();
    expect(getSources()[1].stop).not.toHaveBeenCalled();
  });

  test("layers child events after their delay", async () => {
    const { playSound } = await importSounds();
    playSound("submenu_select");
    await flush();
    const select = getSource("submenu_select_01.wav");
    expect(select.playbackRate.value).toBe(1.2);
    expect(select.start).toHaveBeenCalledWith(10);
    const close = getSource("inventory_item_close_01.wav");
    expect(close.output?.gain.value).toBe(0.15);
    expect(close.start).toHaveBeenCalledWith(10.1);
    const slideIn = getSource("submenu_leveloptions_slidein_01.wav");
    expect(slideIn.output?.gain.value).toBe(0.1);
    expect(slideIn.start).toHaveBeenCalledWith(10.1);
  });

  test("loops until stopped", async () => {
    const { playSound } = await importSounds();
    const handle = playSound("laptop_button_fill_loop", { loop: true });
    await flush();
    const source = getSource("ui/laptop_button_fill_loop_01.wav");
    expect(source.loop).toBe(true);
    expect(source.stop).not.toHaveBeenCalled();
    handle.stop();
    expect(source.stop).toHaveBeenCalled();
  });

  test("never starts a sound stopped while it was loading", async () => {
    const { playSound } = await importSounds();
    playSound("case_drop").stop();
    await flush();
    expect(getSources()).toHaveLength(0);
  });
});

describe("initSounds", () => {
  test("creates the context on the first gesture and preloads", async () => {
    activation.hasBeenActive = false;
    const { initSounds } = await importSounds();
    const dispose = initSounds();
    expect(FakeAudioContext.instances).toHaveLength(0);
    activation.hasBeenActive = true;
    window.dispatchEvent(new MouseEvent("mousedown"));
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(
      "/sounds/ui/panorama/itemtile_plastic_rollover_15.wav"
    );
    expect(fetch).not.toHaveBeenCalledWith(
      "/sounds/ui/panorama/case_drop_01.wav"
    );
    dispose();
  });
});
