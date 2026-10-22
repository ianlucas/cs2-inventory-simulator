/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2Inventory,
  CS2InventoryItem,
  CS2_ITEMS
} from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ViewerItemInput } from "./viewer";
import type { ViewerApi, ViewerCaptured } from "./viewer-api.client";
import { getItemIconKey, getViewerIconSlot } from "./viewer-icon";
import {
  VIEWER_ICON_API_CALLS_PER_MINUTE,
  VIEWER_ICON_API_CALL_BURST,
  VIEWER_ICON_CAPTURE_TIMEOUT_MS,
  VIEWER_ICON_IDLE_TEARDOWN_MS,
  VIEWER_ICON_NETWORK_BACKOFF_BASE_MS,
  VIEWER_ICON_NETWORK_BACKOFF_CAP_MS,
  VIEWER_ICON_PROBE_TIMEOUT_MS,
  VIEWER_ICON_STARTUP_TIMEOUT_MS,
  VIEWER_ICON_VISIBLE_DWELL_MS,
  VIEWER_ICON_WEBGL_DISABLE_MS,
  ViewerIconBudget,
  ViewerIconEntry,
  ViewerIconLock,
  ViewerIcons
} from "./viewer-icon.client";

CS2Economy.load({ items: CS2_ITEMS, language: english });

interface FakeApi {
  api: ViewerApi;
  captured: number[];
  destroy: () => void;
  emit: (type: string, data: unknown) => void;
  reply: (result: Partial<ViewerCaptured>) => void;
  timeOut: () => void;
}

function fakeApi({
  answers = true,
  ready = true
}: { answers?: boolean; ready?: boolean } = {}): FakeApi {
  const captured: number[] = [];
  const handlers = new Map<string, (data: unknown) => void>();
  const traffic: string[] = [];
  let pending: ((result: ViewerCaptured) => void) | undefined;
  let fail: ((error: Error) => void) | undefined;
  const api = {
    capture(item: { id: number }) {
      captured.push(item.id);
      traffic.push(`capture ${item.id}`);
      return new Promise<ViewerCaptured>((resolve, reject) => {
        pending = resolve;
        fail = reject;
      });
    },
    describeSince: (mark: number) => traffic.slice(mark).join(", "),
    getState(timeoutMs: number) {
      traffic.push("getState");
      if (answers) {
        traffic.push("state");
        return Promise.resolve({});
      }
      return new Promise((_, reject) =>
        setTimeout(() => {
          traffic.push("no state");
          reject(new Error("ViewerApi: getState timed out."));
        }, timeoutMs)
      );
    },
    markLog: () => traffic.length,
    on: (type: string, listener: (data: unknown) => void) => {
      handlers.set(type, listener);
      return () => handlers.delete(type);
    },
    whenReady: () => (ready ? Promise.resolve() : new Promise<void>(() => {}))
  } as unknown as ViewerApi;
  const end = (error: string) => {
    const reject = fail;
    fail = undefined;
    pending = undefined;
    reject?.(new Error(`ViewerApi: ${error}.`));
  };
  return {
    api,
    captured,
    destroy: () => end("destroyed"),
    emit: (type, data) => handlers.get(type)?.(data),
    reply: (result) => {
      const resolve = pending;
      pending = undefined;
      fail = undefined;
      resolve?.({ apiCalls: 1, item: { id: 0 }, ...result });
    },
    timeOut: () => {
      traffic.push("timed out");
      end("capture timed out");
    }
  };
}

function memoryStore() {
  const entries = new Map<string, Omit<ViewerIconEntry, "key" | "usedAt">>();
  const written: { error?: string; key: string; retryAfter?: number }[] = [];
  const counts = { pruned: 0 };
  return {
    counts,
    entries,
    written,
    store: {
      read: async (key: string) => {
        const entry = entries.get(key);
        return entry === undefined ? undefined : { ...entry, key, usedAt: 0 };
      },
      writeImage: async (key: string) => {
        written.push({ key });
      },
      writeFailure: async (key: string, error: string, retryAfter: number) => {
        written.push({ error, key, retryAfter });
      },
      prune: async () => {
        counts.pruned++;
      }
    }
  };
}

function fakeLock({ elsewhere = false }: { elsewhere?: boolean } = {}) {
  const state = { elsewhere, here: false, waiting: false };
  let grant: (() => void) | undefined;
  const lock: ViewerIconLock = (_name, signal) =>
    new Promise((resolve) => {
      grant = () => {
        grant = undefined;
        state.waiting = false;
        state.here = true;
        resolve(() => {
          state.here = false;
        });
      };
      signal.addEventListener("abort", () => {
        grant = undefined;
        state.waiting = false;
        resolve(undefined);
      });
      if (state.elsewhere) {
        state.waiting = true;
      } else {
        grant();
      }
    });
  return {
    lock,
    releaseElsewhere: () => {
      state.elsewhere = false;
      grant?.();
    },
    state
  };
}

function setup({
  dwellMs = 0,
  host = true,
  lock = fakeLock().lock,
  next = () => fakeApi(),
  onScreen = true,
  strict = false
}: {
  dwellMs?: number;
  host?: boolean;
  lock?: ViewerIconLock;
  next?: () => FakeApi | undefined;
  onScreen?: boolean;
  strict?: boolean;
} = {}) {
  stubIntersectionObserver();
  const memory = memoryStore();
  const icons = new ViewerIcons({ dwellMs, lock, store: memory.store });
  if (onScreen) {
    const request = icons.request.bind(icons);
    const shown = new Set<string>();
    icons.request = (item, slot = getViewerIconSlot(item)) => {
      if (!shown.has(slot)) {
        shown.add(slot);
        const tile = document.createElement("div");
        icons.observe(slot, tile);
        intersect(tile);
      }
      request(item, slot);
    };
  }
  const mounts: FakeApi[] = [];
  const seeds: (ViewerItemInput | undefined)[] = [];
  let mounted: { generation: number; viewer?: FakeApi } | undefined;
  const sync = () => {
    const generation = icons.getMountedGeneration();
    if (generation === mounted?.generation) {
      return;
    }
    if (mounted !== undefined) {
      mounted.viewer?.destroy();
      icons.setApi(mounted.generation, undefined);
      mounted = undefined;
    }
    if (generation === undefined) {
      return;
    }
    seeds.push(icons.getSeed());
    if (strict) {
      const discarded = next();
      if (discarded !== undefined) {
        mounts.push(discarded);
        icons.setApi(generation, discarded.api);
        discarded.destroy();
        icons.setApi(generation, undefined);
      }
    }
    const viewer = next();
    mounted = { generation, viewer };
    if (viewer !== undefined) {
      mounts.push(viewer);
      icons.setApi(generation, viewer.api);
    }
  };
  icons.subscribeGenerator(() => queueMicrotask(sync));
  const attachHost = () => icons.attachHost();
  if (host) {
    attachHost();
  }
  return {
    ...memory,
    attachHost,
    icons,
    isMounted: () => icons.getMountedGeneration() !== undefined,
    mounts,
    seeds,
    urlOf: (item: ViewerItemInput) => icons.getUrl(getViewerIconSlot(item))
  };
}

function stubVisibility(initial: DocumentVisibilityState) {
  let state = initial;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state
  });
  return (next: DocumentVisibilityState) => {
    state = next;
    document.dispatchEvent(new Event("visibilitychange"));
  };
}

function stubFocus(initial: boolean) {
  const hasFocus = vi.spyOn(document, "hasFocus").mockReturnValue(initial);
  return (focused: boolean) => {
    hasFocus.mockReturnValue(focused);
    window.dispatchEvent(new Event(focused ? "focus" : "blur"));
  };
}

type IntersectionCallback = (
  entries: { isIntersecting: boolean; target: Element }[]
) => void;

const observedTiles = new Map<Element, IntersectionCallback>();

function stubIntersectionObserver() {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      private readonly callback: IntersectionCallback;
      constructor(callback: IntersectionCallback) {
        this.callback = callback;
      }
      observe(tile: Element) {
        observedTiles.set(tile, this.callback);
      }
      unobserve(tile: Element) {
        observedTiles.delete(tile);
      }
      disconnect() {}
    }
  );
}

function intersect(tile: Element, isIntersecting = true) {
  observedTiles.get(tile)?.([{ isIntersecting, target: tile }]);
}

function watch(icons: ViewerIcons, item: ViewerItemInput) {
  const tile = document.createElement("div");
  icons.observe(getViewerIconSlot(item), tile);
  return tile;
}

async function flush(): Promise<void> {
  for (let index = 0; index < 50; index++) {
    await Promise.resolve();
  }
}

const A = { id: 4 };
const B = { id: 5 };
const C = { id: 6 };

let revoked: string[];
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  revoked = [];
  URL.createObjectURL = (blob: Blob | MediaSource) =>
    `blob:${(blob as Blob).size}`;
  URL.revokeObjectURL = (url: string) => {
    revoked.push(url);
  };
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  stubFocus(true);
});

afterEach(() => {
  observedTiles.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, "visibilityState");
});

describe("ViewerIcons", () => {
  it("serves a cached icon without asking the viewer to render it, on screen or not", async () => {
    const { entries, icons, isMounted, mounts, urlOf } = setup({
      onScreen: false
    });
    entries.set(getItemIconKey(A), { image: new Blob(["x"]) });

    icons.request(A);
    await flush();

    expect(mounts).toHaveLength(0);
    expect(urlOf(A)).toBe("blob:1");
    expect(isMounted()).toBe(false);
  });

  it("does not re-render an item a previous session found unrenderable", async () => {
    const { entries, icons, mounts, urlOf } = setup();
    entries.set(getItemIconKey(A), {
      error: "weapon",
      retryAfter: Date.now() + 60_000
    });

    icons.request(A);
    await flush();

    expect(mounts).toHaveLength(0);
    expect(urlOf(A)).toBeUndefined();
  });

  it("stores the frame and publishes it to the tile", async () => {
    const viewer = fakeApi();
    const { icons, urlOf, written } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    expect(viewer.captured).toEqual([4]);

    viewer.reply({ image: new Blob(["frame"]) });
    await flush();

    expect(written).toEqual([{ key: getItemIconKey(A) }]);
    expect(urlOf(A)).toBe("blob:5");
  });

  it("spends the budget the capture reports, not one unit per item", async () => {
    const viewer = fakeApi();
    const { icons } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.reply({
      apiCalls: VIEWER_ICON_API_CALL_BURST,
      image: new Blob(["x"])
    });
    await flush();

    icons.request(B);
    await flush();
    expect(viewer.captured).toEqual([4]);

    await vi.advanceTimersByTimeAsync(
      (60_000 / VIEWER_ICON_API_CALLS_PER_MINUTE) * 1.1
    );
    await flush();
    expect(viewer.captured).toEqual([4, 5]);
  });

  it("keeps generating freely for items the viewer answered from its own cache", async () => {
    const viewer = fakeApi();
    const { icons } = setup({ next: () => viewer });

    for (const item of [A, B, C]) {
      icons.request(item);
      await flush();
      viewer.reply({ apiCalls: 0, image: new Blob(["x"]) });
      await flush();
    }

    expect(viewer.captured).toEqual([4, 5, 6]);
  });

  it("renders what is on screen before what the user scrolled past", async () => {
    const viewer = fakeApi();
    const { attachHost, icons } = setup({
      dwellMs: VIEWER_ICON_VISIBLE_DWELL_MS,
      host: false,
      next: () => viewer,
      onScreen: false
    });

    const passed = watch(icons, A);
    const shown = watch(icons, B);
    icons.request(A);
    icons.request(B);
    intersect(passed);
    intersect(passed, false);
    intersect(shown);
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_VISIBLE_DWELL_MS);
    attachHost();
    await flush();
    expect(viewer.captured).toEqual([5]);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    expect(viewer.captured).toEqual([5]);
  });

  it("still prefers a tile seen on screen before the queue knew of its item", async () => {
    const viewer = fakeApi();
    const { attachHost, icons } = setup({
      dwellMs: VIEWER_ICON_VISIBLE_DWELL_MS,
      host: false,
      next: () => viewer,
      onScreen: false
    });

    intersect(watch(icons, B));
    icons.request(A);
    icons.request(B);
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_VISIBLE_DWELL_MS);
    attachHost();
    await flush();

    expect(viewer.captured).toEqual([5]);
  });

  it("draws an item once its tile has stayed on screen for a moment", async () => {
    const viewer = fakeApi();
    const { icons } = setup({
      dwellMs: VIEWER_ICON_VISIBLE_DWELL_MS,
      next: () => viewer,
      onScreen: false
    });

    const tile = watch(icons, A);
    icons.request(A);
    intersect(tile);
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_VISIBLE_DWELL_MS - 1);
    expect(viewer.captured).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    await flush();
    expect(viewer.captured).toEqual([4]);
  });

  it("does not draw the items the user scrolls straight past", async () => {
    const viewer = fakeApi();
    const { icons, isMounted } = setup({
      dwellMs: VIEWER_ICON_VISIBLE_DWELL_MS,
      next: () => viewer,
      onScreen: false
    });

    for (const item of [A, B, C]) {
      const tile = watch(icons, item);
      icons.request(item);
      intersect(tile);
      await vi.advanceTimersByTimeAsync(VIEWER_ICON_VISIBLE_DWELL_MS / 3);
      intersect(tile, false);
    }
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_VISIBLE_DWELL_MS * 10);
    await flush();

    expect(viewer.captured).toEqual([]);
    expect(isMounted()).toBe(false);
    expect(icons.getStatus().queue.map(({ lane }) => lane)).toEqual([
      "queued",
      "queued",
      "queued"
    ]);
  });

  it("never draws an item whose tile was never on screen", async () => {
    const viewer = fakeApi();
    const { icons, isMounted } = setup({
      dwellMs: VIEWER_ICON_VISIBLE_DWELL_MS,
      next: () => viewer,
      onScreen: false
    });

    icons.request(A);
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_VISIBLE_DWELL_MS * 10);
    await flush();

    expect(viewer.captured).toEqual([]);
    expect(isMounted()).toBe(false);
  });

  it("draws an item whose tile was unmounted once a new tile shows it", async () => {
    const viewer = fakeApi();
    const { icons } = setup({
      dwellMs: VIEWER_ICON_VISIBLE_DWELL_MS,
      next: () => viewer,
      onScreen: false
    });

    const tile = document.createElement("div");
    const unwatch = icons.observe(getViewerIconSlot(A), tile);
    icons.request(A);
    intersect(tile);
    await flush();
    unwatch();
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_VISIBLE_DWELL_MS * 10);
    expect(viewer.captured).toEqual([]);

    intersect(watch(icons, A));
    icons.request(A);
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_VISIBLE_DWELL_MS);
    await flush();
    expect(viewer.captured).toEqual([4]);
  });

  it("finishes drawing an item whose tile scrolls away mid-capture", async () => {
    const viewer = fakeApi();
    const { icons, urlOf } = setup({
      dwellMs: VIEWER_ICON_VISIBLE_DWELL_MS,
      next: () => viewer,
      onScreen: false
    });

    const tile = watch(icons, A);
    icons.request(A);
    intersect(tile);
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_VISIBLE_DWELL_MS);
    await flush();
    intersect(tile, false);
    await flush();
    viewer.reply({ image: new Blob(["x"]) });
    await flush();

    expect(viewer.captured).toEqual([4]);
    expect(urlOf(A)).toBe("blob:1");
  });

  it("does not generate while no host is mounted", async () => {
    const viewer = fakeApi();
    const { attachHost, icons, isMounted } = setup({
      host: false,
      next: () => viewer
    });

    icons.request(A);
    await flush();
    expect(isMounted()).toBe(false);

    attachHost();
    await flush();
    expect(viewer.captured).toEqual([4]);
  });

  it("keeps its generator when React mounts the viewer twice in development", async () => {
    const { icons, mounts, urlOf } = setup({ strict: true });

    icons.request(A);
    await flush();

    expect(icons.getMountedGeneration()).toBe(1);
    expect(mounts).toHaveLength(2);
    expect(mounts[0].captured).toEqual([]);
    expect(mounts[1].captured).toEqual([4]);

    mounts[1].reply({ image: new Blob(["x"]) });
    await flush();
    expect(urlOf(A)).toBeDefined();
  });

  it("does not spend an attempt on a capture whose viewer was torn down", async () => {
    const viewers = [fakeApi(), fakeApi()];
    let mounted = 0;
    const { icons, written } = setup({ next: () => viewers[mounted++] });

    icons.request(A);
    await flush();
    viewers[0].destroy();
    icons.setApi(1, undefined);
    await flush();
    expect(icons.getStatus().recent.at(-1)?.outcome).toBe("interrupted");
    expect(icons.getStatus().queue[0].attempts).toBe(0);
    expect(written).toEqual([]);

    await vi.advanceTimersByTimeAsync(VIEWER_ICON_STARTUP_TIMEOUT_MS);
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_NETWORK_BACKOFF_BASE_MS);
    await flush();
    expect(viewers[1].captured).toEqual([4]);
  });

  it("stands down while an interactive viewer is on screen", async () => {
    const viewer = fakeApi();
    const { icons, isMounted } = setup({ next: () => viewer });
    const resume = icons.pause();

    icons.request(A);
    await flush();
    expect(viewer.captured).toEqual([]);
    expect(isMounted()).toBe(false);

    resume();
    await flush();
    expect(viewer.captured).toEqual([4]);
  });

  it("drops the capture in flight for an interactive viewer, and retries it without spending an attempt", async () => {
    const viewer = fakeApi();
    const { icons, isMounted, urlOf, written } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    for (let pause = 0; pause < 5; pause++) {
      const resume = icons.pause();
      await flush();
      expect(isMounted()).toBe(false);
      resume();
      await flush();
    }
    expect(viewer.captured).toEqual([4, 4, 4, 4, 4, 4]);

    viewer.reply({ error: "encode" });
    await flush();
    expect(viewer.captured).toHaveLength(7);
    viewer.reply({ image: new Blob(["x"]) });
    await flush();

    expect(urlOf(A)).toBeDefined();
    expect(written).toEqual([{ key: getItemIconKey(A) }]);
  });

  it("stops generating while the tab is hidden and resumes when it returns", async () => {
    const setVisibility = stubVisibility("visible");
    const viewer = fakeApi();
    const { icons, isMounted } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.reply({ image: new Blob(["x"]) });
    await flush();

    setVisibility("hidden");
    icons.request(B);
    await flush();
    expect(viewer.captured).toEqual([4]);
    expect(isMounted()).toBe(false);

    setVisibility("visible");
    await flush();
    expect(viewer.captured).toEqual([4, 5]);
  });

  it("drops the capture in flight when the tab hides, and retries it when it returns", async () => {
    const setVisibility = stubVisibility("visible");
    const viewer = fakeApi();
    const { icons, isMounted, urlOf } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    setVisibility("hidden");
    await flush();
    expect(isMounted()).toBe(false);

    setVisibility("visible");
    await flush();
    expect(viewer.captured).toEqual([4, 4]);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    expect(urlOf(A)).toBeDefined();
  });

  it("retries a capture that died with the generator, rather than losing the item", async () => {
    const viewer = fakeApi();
    const { icons, urlOf } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.destroy();
    await flush();
    expect(viewer.captured).toEqual([4, 4]);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    expect(urlOf(A)).toBeDefined();
  });

  it("gives up for an hour on an item whose captures keep dying, and reports it", async () => {
    const viewer = fakeApi();
    const { icons, urlOf, written } = setup({ next: () => viewer });

    icons.request(A);
    for (let attempt = 0; attempt < 5; attempt++) {
      await flush();
      viewer.destroy();
      await flush();
    }

    expect(viewer.captured).toEqual([4, 4]);
    expect(written).toEqual([
      {
        error: "crashed",
        key: getItemIconKey(A),
        retryAfter: Date.now() + 60 * 60_000
      }
    ]);
    expect(urlOf(A)).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "[InventorySimulator] The 3D viewer gave up on an item's icon (crashed).",
      expect.objectContaining({ key: getItemIconKey(A) })
    );

    icons.request(B);
    await flush();
    expect(viewer.captured.at(-1)).toBe(5);
  });

  it("reports what passed between the page and each viewer since each capture when it gives up on an item", async () => {
    let mounted = 0;
    const { icons, mounts } = setup({
      next: () => fakeApi({ answers: mounted++ === 0 })
    });

    icons.request(B);
    await flush();
    mounts[0].reply({ image: new Blob(["x"]) });
    await flush();
    icons.request(A);
    await flush();
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_CAPTURE_TIMEOUT_MS);
    mounts[0].timeOut();
    await flush();
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_CAPTURE_TIMEOUT_MS);
    mounts[1].timeOut();
    await flush();
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_PROBE_TIMEOUT_MS);
    await flush();

    expect(consoleError).toHaveBeenCalledWith(
      "[InventorySimulator] The 3D viewer gave up on an item's icon (crashed).",
      {
        attempts: [
          "iframe #1 capture 4, timed out, getState, state",
          "iframe #2 capture 4, timed out, getState, no state"
        ],
        device: { cores: 8, gpu: null, memory: null },
        key: getItemIconKey(A),
        recent: [
          "-95s ok 5",
          "-50s crashed 4 (this item)",
          "-0s crashed 4 (this item)"
        ]
      }
    );
  });

  it("gives a viewer that let a capture time out a few seconds to answer before moving on", async () => {
    const { icons, mounts } = setup({
      next: () => fakeApi({ answers: false })
    });

    icons.request(A);
    await flush();
    mounts[0].timeOut();
    await flush();
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_PROBE_TIMEOUT_MS - 1);
    expect(mounts).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1);
    await flush();
    expect(mounts).toHaveLength(2);
    expect(mounts[1].captured).toEqual([4]);
  });

  it("counts a capture the viewer let time out, whatever the viewer says while it waits for an answer", async () => {
    const { icons, mounts } = setup({
      next: () => fakeApi({ answers: false })
    });

    icons.request(A);
    await flush();
    mounts[0].timeOut();
    await flush();
    mounts[0].emit("unsupported", { reason: "network" });
    await flush();

    const { budget, queue, recent } = icons.getStatus();
    expect(recent.at(-1)?.outcome).toBe("crashed");
    expect(queue[0].attempts).toBe(1);
    expect(budget.cooldownReason).toBeUndefined();
  });

  it("names the GPU in its report as the viewer does, letting go of the context it asked", async () => {
    const loseContext = vi.fn();
    const UNMASKED_VENDOR_WEBGL = 0x9245;
    const UNMASKED_RENDERER_WEBGL = 0x9246;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      getExtension: (name: string) =>
        name === "WEBGL_debug_renderer_info"
          ? { UNMASKED_RENDERER_WEBGL, UNMASKED_VENDOR_WEBGL }
          : name === "WEBGL_lose_context"
            ? { loseContext }
            : null,
      getParameter: (parameter: number) =>
        parameter === UNMASKED_RENDERER_WEBGL
          ? "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)"
          : "Google Inc. (Intel)"
    } as unknown as WebGLRenderingContext);
    const viewer = fakeApi();
    const { icons } = setup({ next: () => viewer });

    icons.request(A);
    for (let attempt = 0; attempt < 2; attempt++) {
      await flush();
      viewer.reply({ error: "encode" });
      await flush();
    }

    expect(consoleError).toHaveBeenCalledWith(
      "[InventorySimulator] The 3D viewer gave up on an item's icon (encode).",
      expect.objectContaining({
        device: expect.objectContaining({
          gpu: {
            renderer:
              "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)",
            vendor: "Google Inc. (Intel)"
          }
        })
      })
    );
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it("retries a render that failed to encode, on a fresh viewer", async () => {
    const viewer = fakeApi();
    const { icons, mounts, urlOf } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.reply({ error: "encode" });
    await flush();

    expect(mounts).toHaveLength(2);
    expect(viewer.captured).toEqual([4, 4]);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    expect(urlOf(A)).toBeDefined();
  });

  it("gives up on an item whose renders keep failing to encode, without counting its timeouts", async () => {
    const viewer = fakeApi();
    const { icons, urlOf, written } = setup({ next: () => viewer });

    icons.request(A);
    for (const error of ["encode", "timeout", "encode"] as const) {
      await flush();
      viewer.reply({ error });
      await flush();
      await vi.advanceTimersByTimeAsync(
        VIEWER_ICON_NETWORK_BACKOFF_BASE_MS + 1_000
      );
    }

    expect(viewer.captured).toEqual([4, 4, 4]);
    expect(written).toEqual([
      {
        error: "encode",
        key: getItemIconKey(A),
        retryAfter: expect.any(Number)
      }
    ]);
    expect(urlOf(A)).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "[InventorySimulator] The 3D viewer gave up on an item's icon (encode).",
      expect.objectContaining({ key: getItemIconKey(A) })
    );
  });

  it("backs off and keeps retrying an item whose renders time out, without remembering or reporting it", async () => {
    const viewer = fakeApi();
    const { icons, mounts, urlOf, written } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.reply({ error: "timeout" });
    await flush();
    expect(mounts).toHaveLength(1);
    expect(viewer.captured).toEqual([4]);

    for (let timeout = 0; timeout < 4; timeout++) {
      await vi.advanceTimersByTimeAsync(
        VIEWER_ICON_NETWORK_BACKOFF_CAP_MS + 1_000
      );
      await flush();
      viewer.reply({ error: "timeout" });
      await flush();
    }
    expect(viewer.captured).toHaveLength(5);
    expect(written).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(
      VIEWER_ICON_NETWORK_BACKOFF_CAP_MS + 1_000
    );
    await flush();
    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    expect(urlOf(A)).toBeDefined();
  });

  it("tries an item that failed to encode again only once its retry window has passed", async () => {
    const viewer = fakeApi();
    const { entries, icons, urlOf } = setup({ next: () => viewer });
    entries.set(getItemIconKey(B), {
      error: "encode",
      retryAfter: Date.now() + 60_000
    });
    entries.set(getItemIconKey(A), {
      error: "encode",
      retryAfter: Date.now() - 1
    });

    icons.request(B);
    icons.request(A);
    await flush();

    expect(viewer.captured).toEqual([4]);
    expect(urlOf(B)).toBeUndefined();
  });

  it("remembers a failure about the item for six hours and reports it, but not one about the moment", async () => {
    const viewer = fakeApi();
    const { icons, written } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.reply({ error: "weapon" });
    await flush();
    const itemFailure = {
      error: "weapon",
      key: getItemIconKey(A),
      retryAfter: Date.now() + 6 * 60 * 60_000
    };
    expect(written).toEqual([itemFailure]);
    expect(consoleError).toHaveBeenCalledWith(
      "[InventorySimulator] The 3D viewer could not render an item's icon (weapon).",
      { key: getItemIconKey(A) }
    );

    icons.request(B);
    await flush();
    viewer.reply({ error: "timeout" });
    await flush();
    expect(written).toEqual([itemFailure]);
  });

  it("gives an item the viewer rejected another chance once its retry window has passed", async () => {
    const viewer = fakeApi();
    const { entries, icons } = setup({ next: () => viewer });
    entries.set(getItemIconKey(B), {
      error: "weapon",
      retryAfter: Date.now() + 60_000
    });
    entries.set(getItemIconKey(A), {
      error: "weapon",
      retryAfter: Date.now() - 1
    });

    icons.request(B);
    icons.request(A);
    await flush();

    expect(viewer.captured).toEqual([4]);
  });

  it("retries an item a previous session rejected without a retry window", async () => {
    const viewer = fakeApi();
    const { entries, icons } = setup({ next: () => viewer });
    entries.set(getItemIconKey(A), { error: "weapon" });

    icons.request(A);
    await flush();

    expect(viewer.captured).toEqual([4]);
  });

  it("does not blame the capture in flight for an item the viewer rejected out of band", async () => {
    const viewer = fakeApi();
    const { icons, urlOf, written } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.emit("unsupported", { reason: "keychain" });
    await flush();
    expect(written).toEqual([]);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    expect(urlOf(A)).toBeDefined();
  });

  it("keeps generating when the viewer reports an unsupported item with nothing in flight", async () => {
    const viewer = fakeApi();
    const { icons } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    viewer.emit("unsupported", { reason: "sticker" });
    await flush();

    icons.request(B);
    await flush();
    expect(viewer.captured).toEqual([4, 5]);
    expect(icons.getStatus().disabled).toBeUndefined();
  });

  it("turns icons off for this page load only when the viewer will not hand back a clean frame", async () => {
    const viewer = fakeApi();
    const { icons, written } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.reply({ error: "untrusted" });
    await flush();

    expect(icons.getStatus().disabled).toEqual({ reason: "untrusted" });
    expect(written).toEqual([]);
    expect(consoleError).toHaveBeenCalledTimes(1);

    icons.request(B);
    await flush();
    expect(viewer.captured).toEqual([4]);

    const reloaded = setup({ next: () => viewer });
    expect(reloaded.icons.getStatus().disabled).toBeUndefined();
  });

  it("turns icons off for a while on a device the viewer cannot render on", async () => {
    const viewer = fakeApi();
    const { icons, written } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.reply({ error: "webgl" });
    await flush();

    expect(icons.getStatus().disabled).toEqual({
      reason: "webgl",
      until: Date.now() + VIEWER_ICON_WEBGL_DISABLE_MS
    });
    expect(written).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();

    const reloaded = setup({ next: () => viewer });
    expect(reloaded.icons.getStatus().disabled?.reason).toBe("webgl");

    await vi.advanceTimersByTimeAsync(VIEWER_ICON_WEBGL_DISABLE_MS);
    reloaded.icons.request(B);
    await flush();
    expect(viewer.captured).toEqual([4, 5]);
  });

  it("never stands up a generator for an inventory it already has icons for", async () => {
    const { entries, icons, isMounted } = setup();
    entries.set(getItemIconKey(A), { image: new Blob(["x"]) });
    entries.set(getItemIconKey(B), {
      error: "weapon",
      retryAfter: Date.now() + 60_000
    });

    icons.request(A);
    icons.request(B);
    await flush();

    expect(isMounted()).toBe(false);
  });

  it("drops the generator while it waits out a rate limit, rather than idling a context", async () => {
    const viewer = fakeApi();
    const { icons, isMounted } = setup({ next: () => viewer });
    const cooldown = VIEWER_ICON_IDLE_TEARDOWN_MS * 3;

    icons.request(A);
    await flush();
    viewer.emit("rateLimited", { retryAfterMs: cooldown });
    viewer.reply({ image: new Blob(["x"]) });
    await flush();

    icons.request(B);
    await flush();
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_IDLE_TEARDOWN_MS + 1);
    await flush();
    expect(viewer.captured).toEqual([4]);
    expect(isMounted()).toBe(false);
    expect(icons.getStatus().budget.cooldownReason).toBe("rate-limit");

    await vi.advanceTimersByTimeAsync(cooldown);
    await flush();
    expect(isMounted()).toBe(true);
    expect(viewer.captured).toEqual([4, 5]);
  });

  it("drops the generator once the queue drains, freeing the WebGL context", async () => {
    const viewer = fakeApi();
    const { icons, isMounted } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    expect(isMounted()).toBe(true);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    await vi.advanceTimersByTimeAsync(VIEWER_ICON_IDLE_TEARDOWN_MS + 1);
    await flush();

    expect(isMounted()).toBe(false);
  });

  it("only generates on the tab the user is on, not one merely visible beside it", async () => {
    const setFocus = stubFocus(false);
    const viewer = fakeApi();
    const lock = fakeLock();
    const { icons, isMounted } = setup({ lock: lock.lock, next: () => viewer });

    icons.request(A);
    await flush();
    expect(isMounted()).toBe(false);
    expect(lock.state.here).toBe(false);

    setFocus(true);
    await flush();
    expect(viewer.captured).toEqual([4]);
    expect(lock.state.here).toBe(true);
  });

  it("drops the capture in flight and hands the lock over once the user leaves the tab", async () => {
    const setFocus = stubFocus(true);
    const viewer = fakeApi();
    const lock = fakeLock();
    const { icons, isMounted, urlOf } = setup({
      lock: lock.lock,
      next: () => viewer
    });

    icons.request(A);
    await flush();
    setFocus(false);
    await flush();
    expect(isMounted()).toBe(false);
    expect(lock.state.here).toBe(false);
    expect(icons.getStatus().role).toBe("idle");

    setFocus(true);
    await flush();
    expect(viewer.captured).toEqual([4, 4]);
    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    expect(urlOf(A)).toBeDefined();
  });

  it("hands the lock over once its queue drains", async () => {
    const viewer = fakeApi();
    const lock = fakeLock();
    const { icons } = setup({ lock: lock.lock, next: () => viewer });

    icons.request(A);
    await flush();
    expect(lock.state.here).toBe(true);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    expect(lock.state.here).toBe(false);

    icons.request(B);
    await flush();
    expect(lock.state.here).toBe(true);
    expect(viewer.captured).toEqual([4, 5]);
  });

  it("keeps the lock until what it drew is stored, so the next tab finds it", async () => {
    const setFocus = stubFocus(true);
    const viewer = fakeApi();
    const lock = fakeLock();
    const { icons, store } = setup({ lock: lock.lock, next: () => viewer });
    let stored = () => {};
    store.writeImage = () =>
      new Promise<void>((resolve) => {
        stored = resolve;
      });

    icons.request(A);
    await flush();
    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    setFocus(false);
    await flush();
    expect(lock.state.here).toBe(true);

    stored();
    await flush();
    expect(lock.state.here).toBe(false);
  });

  it("waits its turn while another tab generates, rather than giving up on its items", async () => {
    const viewer = fakeApi();
    const lock = fakeLock({ elsewhere: true });
    const { icons, isMounted } = setup({ lock: lock.lock, next: () => viewer });

    icons.request(A);
    await flush();
    expect(isMounted()).toBe(false);
    expect(icons.getStatus().role).toBe("waiting");

    lock.releaseElsewhere();
    await flush();
    expect(viewer.captured).toEqual([4]);
  });

  it("leaves the line for the lock once the user leaves the tab", async () => {
    const setFocus = stubFocus(true);
    const lock = fakeLock({ elsewhere: true });
    const { icons, isMounted } = setup({ lock: lock.lock });

    icons.request(A);
    await flush();
    expect(lock.state.waiting).toBe(true);

    setFocus(false);
    await flush();
    expect(lock.state.waiting).toBe(false);

    lock.releaseElsewhere();
    await flush();
    expect(lock.state.here).toBe(false);
    expect(isMounted()).toBe(false);
  });

  it("serves an already generated icon while another tab holds the lock", async () => {
    const lock = fakeLock({ elsewhere: true });
    const { entries, icons, mounts, urlOf } = setup({ lock: lock.lock });
    entries.set(getItemIconKey(A), { image: new Blob(["x"]) });

    icons.request(A);
    await flush();

    expect(mounts).toHaveLength(0);
    expect(urlOf(A)).toBeDefined();
  });

  it("shows what another tab drew while it waited, rather than drawing it again", async () => {
    const lock = fakeLock({ elsewhere: true });
    const { entries, icons, isMounted, urlOf } = setup({ lock: lock.lock });

    icons.request(A);
    await flush();
    entries.set(getItemIconKey(A), { image: new Blob(["x"]) });
    lock.releaseElsewhere();
    await flush();

    expect(isMounted()).toBe(false);
    expect(urlOf(A)).toBe("blob:1");
    expect(lock.state.here).toBe(false);
  });

  it("gives up on what another tab gave up on while it waited", async () => {
    const lock = fakeLock({ elsewhere: true });
    const { entries, icons, isMounted } = setup({ lock: lock.lock });

    icons.request(A);
    await flush();
    entries.set(getItemIconKey(A), {
      error: "weapon",
      retryAfter: Date.now() + 60_000
    });
    lock.releaseElsewhere();
    await flush();

    expect(isMounted()).toBe(false);
    expect(icons.getStatus().queue).toEqual([]);
  });

  it("renders nothing where the browser cannot lock, rather than letting every tab generate", async () => {
    const { icons, isMounted, mounts, urlOf } = setup({
      lock: async () => undefined
    });

    icons.request(A);
    await flush();

    expect(mounts).toHaveLength(0);
    expect(isMounted()).toBe(false);
    expect(urlOf(A)).toBeUndefined();
    expect(icons.getStatus().role).toBe("unsupported");
  });

  it("backs off the CDN rather than asking it again straight away", async () => {
    const viewer = fakeApi();
    const { icons } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.reply({ error: "network" });
    await flush();
    expect(viewer.captured).toEqual([4]);

    await vi.advanceTimersByTimeAsync(
      VIEWER_ICON_NETWORK_BACKOFF_BASE_MS - 1_000
    );
    await flush();
    expect(viewer.captured).toEqual([4]);

    await vi.advanceTimersByTimeAsync(2_000);
    await flush();
    expect(viewer.captured).toEqual([4, 4]);
  });

  it("waits longer each time the CDN refuses again", async () => {
    const viewer = fakeApi();
    const { icons } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.reply({ error: "network" });
    await flush();
    await vi.advanceTimersByTimeAsync(
      VIEWER_ICON_NETWORK_BACKOFF_BASE_MS + 1_000
    );
    await flush();
    expect(viewer.captured).toEqual([4, 4]);

    viewer.reply({ error: "asset" });
    await flush();
    await vi.advanceTimersByTimeAsync(
      VIEWER_ICON_NETWORK_BACKOFF_BASE_MS + 1_000
    );
    await flush();
    expect(viewer.captured).toEqual([4, 4]);

    await vi.advanceTimersByTimeAsync(
      VIEWER_ICON_NETWORK_BACKOFF_BASE_MS + 1_000
    );
    await flush();
    expect(viewer.captured).toEqual([4, 4, 4]);
  });

  it("keeps retrying an item that keeps failing on the network, without remembering or reporting it", async () => {
    const viewer = fakeApi();
    const { icons, urlOf, written } = setup({ next: () => viewer });

    icons.request(A);
    for (let failure = 0; failure < 8; failure++) {
      await flush();
      viewer.reply({ error: "network" });
      await flush();
      await vi.advanceTimersByTimeAsync(
        VIEWER_ICON_NETWORK_BACKOFF_CAP_MS + 1_000
      );
    }
    await flush();
    expect(viewer.captured).toHaveLength(9);
    expect(written).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();

    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    expect(urlOf(A)).toBeDefined();
    expect(icons.getStatus().budget.networkStep).toBe(0);
  });

  it("replaces the viewer after a network failure, as a fatal viewer stops answering", async () => {
    const viewer = fakeApi();
    const { icons, isMounted, mounts } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.emit("unsupported", { reason: "network" });
    await flush();
    expect(isMounted()).toBe(false);

    await vi.advanceTimersByTimeAsync(
      VIEWER_ICON_NETWORK_BACKOFF_BASE_MS + 1_000
    );
    await flush();
    expect(mounts).toHaveLength(2);
    expect(viewer.captured).toEqual([4, 4]);
  });

  it("replaces a viewer that turned fatal with nothing in flight", async () => {
    const viewer = fakeApi();
    const { icons, mounts } = setup({ next: () => viewer });

    icons.request(A);
    await flush();
    viewer.reply({ image: new Blob(["x"]) });
    await flush();

    viewer.emit("unsupported", { reason: "network" });
    await flush();
    icons.request(B);
    await vi.advanceTimersByTimeAsync(
      VIEWER_ICON_NETWORK_BACKOFF_BASE_MS + 1_000
    );
    await flush();

    expect(mounts).toHaveLength(2);
    expect(viewer.captured).toEqual([4, 5]);
  });

  it("backs off and retries when the viewer never hands back an api", async () => {
    const viewers: (FakeApi | undefined)[] = [undefined, fakeApi()];
    let mounted = 0;
    const { icons, isMounted } = setup({ next: () => viewers[mounted++] });

    icons.request(A);
    await flush();
    expect(isMounted()).toBe(true);

    await vi.advanceTimersByTimeAsync(VIEWER_ICON_STARTUP_TIMEOUT_MS + 1);
    await flush();
    expect(isMounted()).toBe(false);
    expect(icons.getStatus().recent.at(-1)?.outcome).toBe("startup-timeout");

    await vi.advanceTimersByTimeAsync(VIEWER_ICON_NETWORK_BACKOFF_BASE_MS);
    await flush();
    expect(viewers[1]?.captured).toEqual([4]);
  });

  it("replaces a viewer that never becomes ready, rather than stalling the queue behind it", async () => {
    const viewers = [fakeApi({ ready: false }), fakeApi()];
    const { icons, isMounted, mounts } = setup({
      next: () => viewers[mounts.length]
    });

    icons.request(A);
    await flush();
    expect(mounts).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(VIEWER_ICON_STARTUP_TIMEOUT_MS);
    await flush();
    expect(isMounted()).toBe(false);
    expect(viewers[0].captured).toEqual([]);

    await vi.advanceTimersByTimeAsync(VIEWER_ICON_NETWORK_BACKOFF_BASE_MS);
    await flush();
    expect(mounts).toHaveLength(2);
    expect(viewers[1].captured).toEqual([4]);
  });

  it("counts failures towards the prune, not only the frames it stored", async () => {
    const viewer = fakeApi();
    const { counts, icons, written } = setup({ next: () => viewer });

    for (let index = 0; index < 32; index++) {
      icons.request({ id: 4, seed: index + 1 });
      await flush();
      viewer.reply({ apiCalls: 0, error: "weapon" });
      await flush();
    }

    expect(written).toHaveLength(32);
    expect(counts.pruned).toBe(1);
  });

  it("boots the viewer on the item it is about to capture", async () => {
    const { icons, seeds } = setup();

    icons.request(A);
    await flush();

    expect(seeds).toEqual([A]);
  });

  it("renders the appearance the icon is keyed by, not the raw item", async () => {
    const { icons, seeds } = setup();

    icons.request({ id: 4, stickers: {}, wear: 0.123456 });
    await flush();

    expect(seeds).toStrictEqual([{ id: 4, wear: 0.1235 }]);
  });

  it("reports what it is doing", async () => {
    const viewer = fakeApi();
    const { icons } = setup({ next: () => viewer });

    icons.request(A);
    icons.request(B);
    await flush();

    const status = icons.getStatus();
    expect(status.role).toBe("generator");
    expect(status.generator).toMatchObject({
      host: true,
      mounted: true,
      ready: true,
      capturing: getItemIconKey(A)
    });
    expect(status.queue.map(({ key, lane }) => ({ key, lane }))).toEqual([
      { key: getItemIconKey(A), lane: "visible" },
      { key: getItemIconKey(B), lane: "visible" }
    ]);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    expect(icons.getStatus().recent).toEqual([
      { at: Date.now(), id: 4, key: getItemIconKey(A), outcome: "ok" }
    ]);
    expect(icons.getStatus().published).toBe(1);
  });

  describe("edited items", () => {
    let inventory: CS2Inventory;

    function add(seed: number) {
      inventory.add({ id: 244, seed, wear: 0.1 });
      return inventory.getAll().at(-1) as CS2InventoryItem;
    }

    function edit(item: CS2InventoryItem, wear: number) {
      inventory.edit(item.uid, { wear });
      return inventory.get(item.uid);
    }

    beforeEach(() => {
      inventory = new CS2Inventory({});
    });

    it("renders an edited item before everything already queued", async () => {
      const viewer = fakeApi();
      const { attachHost, icons } = setup({
        host: false,
        next: () => viewer
      });
      const item = add(1);

      icons.request(A);
      icons.request(B);
      icons.request(item);
      await flush();
      icons.request(edit(item, 0.2));
      await flush();
      attachHost();
      await flush();

      expect(viewer.captured).toEqual([244]);
      expect(icons.getStatus().queue.map(({ key }) => key)).toEqual([
        getItemIconKey(A),
        getItemIconKey(B),
        getItemIconKey(item)
      ]);
    });

    it("renders an edited item straight away, even while its tile is off screen", async () => {
      const viewer = fakeApi();
      const { icons } = setup({ next: () => viewer, onScreen: false });
      const item = add(1);

      watch(icons, item);
      icons.request(item);
      await flush();
      expect(viewer.captured).toEqual([]);

      icons.request(edit(item, 0.2));
      await flush();
      expect(viewer.captured).toEqual([244]);
    });

    it("renders the most recent edit first when several are waiting", async () => {
      const viewer = fakeApi();
      const { attachHost, icons } = setup({
        host: false,
        next: () => viewer
      });
      const first = add(1);
      const second = add(2);

      icons.request(first);
      icons.request(second);
      await flush();
      icons.request(edit(first, 0.2));
      icons.request(edit(second, 0.2));
      await flush();
      attachHost();
      await flush();

      expect(icons.getStatus().generator.capturing).toBe(
        getItemIconKey(second)
      );
      viewer.reply({ image: new Blob(["x"]) });
      await flush();
      expect(icons.getStatus().generator.capturing).toBe(getItemIconKey(first));
    });

    it("keeps showing the icon it already has while the new one is generated", async () => {
      const viewer = fakeApi();
      const { icons, urlOf } = setup({ next: () => viewer });
      const item = add(1);

      icons.request(item);
      await flush();
      viewer.reply({ image: new Blob(["before"]) });
      await flush();
      expect(urlOf(item)).toBe("blob:6");

      icons.request(edit(item, 0.2));
      await flush();
      expect(urlOf(item)).toBe("blob:6");
      expect(revoked).toEqual([]);

      viewer.reply({ image: new Blob(["after!!"]) });
      await flush();
      expect(urlOf(item)).toBe("blob:7");
      expect(revoked).toEqual(["blob:6"]);
    });

    it("falls back to the CDN image once no new icon is coming", async () => {
      const viewer = fakeApi();
      const { icons, urlOf } = setup({ next: () => viewer });
      const item = add(1);

      icons.request(item);
      await flush();
      viewer.reply({ image: new Blob(["before"]) });
      await flush();

      icons.request(edit(item, 0.2));
      await flush();
      viewer.reply({ error: "weapon" });
      await flush();

      expect(urlOf(item)).toBeUndefined();
      expect(revoked).toEqual(["blob:6"]);
    });

    it("tells the tile whenever what it shows changes", async () => {
      const viewer = fakeApi();
      const { icons } = setup({ next: () => viewer });
      const item = add(1);
      const listener = vi.fn();
      icons.subscribe(getViewerIconSlot(item), listener);

      icons.request(item);
      await flush();
      listener.mockClear();
      viewer.reply({ image: new Blob(["x"]) });
      await flush();

      expect(listener).toHaveBeenCalled();
    });
  });
});

describe("ViewerIconBudget", () => {
  const STORAGE_KEY = "inventoryItemIconBudget";
  const START = 1_700_000_000_000;
  let budget: ViewerIconBudget;

  beforeEach(() => {
    budget = new ViewerIconBudget();
  });

  it("starts a browser that has never generated with the full burst", () => {
    expect(budget.load(START).tokens).toBe(VIEWER_ICON_API_CALL_BURST);
  });

  it("carries spending across a reload, which is the whole point of storing it", () => {
    budget.spend(VIEWER_ICON_API_CALL_BURST, START);
    expect(new ViewerIconBudget().load(START).tokens).toBe(0);
  });

  it("refills by wall-clock, so a closed tab still earns budget", () => {
    budget.spend(VIEWER_ICON_API_CALL_BURST, START);
    expect(budget.load(START + 60_000).tokens).toBe(
      VIEWER_ICON_API_CALLS_PER_MINUTE
    );
  });

  it("caps an old record at the burst, so a long absence buys no more than a short one", () => {
    budget.spend(VIEWER_ICON_API_CALL_BURST, START);
    expect(budget.load(START + 86_400_000).tokens).toBe(
      VIEWER_ICON_API_CALL_BURST
    );
  });

  it("grants nothing for a clock that moved backwards", () => {
    budget.spend(VIEWER_ICON_API_CALL_BURST, START);
    expect(budget.load(START - 600_000).tokens).toBe(0);
  });

  it("does not overwrite another tab's spending with its own stale balance", () => {
    const other = new ViewerIconBudget();
    budget.spend(VIEWER_ICON_API_CALL_BURST / 2, START);
    other.spend(VIEWER_ICON_API_CALL_BURST / 2, START);
    expect(budget.load(START).tokens).toBe(0);
  });

  it("waits for a token to refill once the burst is spent", () => {
    budget.spend(VIEWER_ICON_API_CALL_BURST, START);
    expect(budget.getWaitMs(START)).toBe(
      60_000 / VIEWER_ICON_API_CALLS_PER_MINUTE
    );
  });

  it("keeps a rate-limit cooldown across a reload, and the longest one seen", () => {
    budget.setCooldown(60_000, "rate-limit", START);
    budget.setCooldown(10_000, "network", START);
    expect(budget.load(START)).toMatchObject({
      cooldownReason: "rate-limit",
      cooldownUntil: START + 60_000
    });
    expect(budget.getWaitMs(START)).toBe(60_000);
  });

  it("doubles the network backoff up to its cap, and resets it on success", () => {
    expect(budget.backOffNetwork(START)).toBe(
      VIEWER_ICON_NETWORK_BACKOFF_BASE_MS
    );
    expect(budget.backOffNetwork(START)).toBe(
      VIEWER_ICON_NETWORK_BACKOFF_BASE_MS * 2
    );
    for (let step = 0; step < 10; step++) {
      budget.backOffNetwork(START);
    }
    expect(budget.backOffNetwork(START)).toBe(
      VIEWER_ICON_NETWORK_BACKOFF_CAP_MS
    );
    expect(budget.load(START).cooldownReason).toBe("network");

    budget.clearNetworkBackoff(START);
    expect(budget.backOffNetwork(START)).toBe(
      VIEWER_ICON_NETWORK_BACKOFF_BASE_MS
    );
  });

  it("starts the network backoff over once it has been quiet for a full cap", () => {
    budget.backOffNetwork(START);
    budget.backOffNetwork(START);
    const pauseEnd = budget.load(START).cooldownUntil;

    expect(
      budget.load(pauseEnd + VIEWER_ICON_NETWORK_BACKOFF_CAP_MS - 1).networkStep
    ).toBe(2);
    expect(
      budget.backOffNetwork(pauseEnd + VIEWER_ICON_NETWORK_BACKOFF_CAP_MS)
    ).toBe(VIEWER_ICON_NETWORK_BACKOFF_BASE_MS);
  });

  it("spends without clearing a cooldown, and waits without refunding tokens", () => {
    budget.setCooldown(60_000, "rate-limit", START);
    budget.spend(5, START);
    const state = budget.load(START);
    expect(state.cooldownUntil).toBe(START + 60_000);
    expect(state.tokens).toBe(VIEWER_ICON_API_CALL_BURST - 5);
  });

  it("falls back to a full burst rather than trusting an unreadable record", () => {
    window.localStorage.setItem(STORAGE_KEY, "not json");
    expect(budget.load(START).tokens).toBe(VIEWER_ICON_API_CALL_BURST);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tokens: "x" }));
    expect(budget.load(START).tokens).toBe(VIEWER_ICON_API_CALL_BURST);
  });
});
