/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ICON_API_CALLS_PER_MINUTE,
  ICON_API_CALL_BURST
} from "./item-icon-budget";
import type { ViewerCaptured } from "./viewer-api";
import type { ViewerApi } from "./viewer-api";

const store = vi.hoisted(() => ({
  entries: new Map<string, { error?: string; image?: Blob }>(),
  written: [] as { error?: string; key: string }[]
}));

vi.mock("./item-icon-store", () => ({
  MAX_STORED_ICONS: 512,
  pruneIcons: async () => {},
  readIcon: async (key: string) => store.entries.get(key),
  writeIcon: async (key: string) => {
    store.written.push({ key });
  },
  writeIconFailure: async (key: string, error: string) => {
    store.written.push({ error, key });
  }
}));

const tabLock = vi.hoisted(() => ({ granted: true }));

vi.mock("./tab-leader", () => ({
  claimTabLock: async () => tabLock.granted
}));

type Queue = typeof import("./item-icon-queue");

interface FakeApi {
  api: ViewerApi;
  captured: string[];
  destroy: () => void;
  emit: (type: string, data: unknown) => void;
  reply: (result: Partial<ViewerCaptured>) => void;
}

function fakeApi(): FakeApi {
  const captured: string[] = [];
  const handlers = new Map<string, (data: unknown) => void>();
  let pending: ((result: ViewerCaptured) => void) | undefined;
  let fail: ((error: Error) => void) | undefined;
  const api = {
    capture(item: { id: number }) {
      captured.push(String(item.id));
      return new Promise<ViewerCaptured>((resolve, reject) => {
        pending = resolve;
        fail = reject;
      });
    },
    on: (type: string, listener: (data: unknown) => void) => {
      handlers.set(type, listener);
      return () => handlers.delete(type);
    }
  } as unknown as ViewerApi;
  return {
    api,
    captured,
    destroy: () => {
      const reject = fail;
      fail = undefined;
      pending = undefined;
      reject?.(new Error("ViewerApi: destroyed."));
    },
    emit: (type, data) => handlers.get(type)?.(data),
    reply: (result) => {
      const resolve = pending;
      pending = undefined;
      resolve?.({ apiCalls: 1, item: { id: 0 }, ...result });
    }
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

async function flush(): Promise<void> {
  for (let index = 0; index < 20; index++) {
    await Promise.resolve();
  }
}

async function load(): Promise<Queue> {
  vi.resetModules();
  return await import("./item-icon-queue");
}

beforeEach(() => {
  vi.useFakeTimers();
  tabLock.granted = true;
  store.entries.clear();
  store.written.length = 0;

  window.localStorage.clear();

  URL.createObjectURL = (blob: Blob | MediaSource) =>
    `blob:${(blob as Blob).size}`;
  URL.revokeObjectURL = () => {};
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, "visibilityState");
});

describe("icon queue", () => {
  it("serves a cached icon without asking the viewer to render it", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);
    store.entries.set("a", { image: new Blob(["x"]) });

    await queue.requestIcon("a", { id: 4 });
    await flush();

    expect(viewer.captured).toEqual([]);
    expect(queue.getIconUrl("a")).toBeDefined();
    expect(queue.isIconGeneratorWanted()).toBe(false);
  });

  it("does not re-render an item a previous session found unrenderable", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);
    store.entries.set("a", { error: "weapon" });

    await queue.requestIcon("a", { id: 4 });
    await flush();

    expect(viewer.captured).toEqual([]);
    expect(queue.getIconUrl("a")).toBeUndefined();
  });

  it("stores the frame and publishes it to the tile", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    await flush();
    expect(viewer.captured).toEqual(["4"]);

    viewer.reply({ image: new Blob(["frame"]) });
    await flush();

    expect(store.written).toEqual([{ key: "a" }]);
    expect(queue.getIconUrl("a")).toBe("blob:5");
  });

  it("spends the budget the capture reports, not one unit per item", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    await flush();

    viewer.reply({
      apiCalls: ICON_API_CALL_BURST,
      image: new Blob(["x"])
    });
    await flush();

    await queue.requestIcon("b", { id: 5 });
    await flush();
    expect(viewer.captured).toEqual(["4"]);

    await vi.advanceTimersByTimeAsync(
      (60_000 / ICON_API_CALLS_PER_MINUTE) * 1.1
    );
    await flush();
    expect(viewer.captured).toEqual(["4", "5"]);
  });

  it("keeps generating freely for items the viewer answered from its own cache", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    for (const [key, id] of [
      ["a", 4],
      ["b", 5],
      ["c", 6]
    ] as const) {
      await queue.requestIcon(key, { id });
      await flush();
      viewer.reply({ apiCalls: 0, image: new Blob(["x"]) });
      await flush();
    }

    expect(viewer.captured).toEqual(["4", "5", "6"]);
  });

  it("renders what is on screen before what the user scrolled past", async () => {
    const queue = await load();
    const viewer = fakeApi();
    const observed: Element[] = [];
    let notify: (
      entries: { isIntersecting: boolean; target: Element }[]
    ) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof notify) {
          notify = callback;
        }
        observe(element: Element) {
          observed.push(element);
        }
        unobserve() {}
        disconnect() {}
      }
    );

    await queue.requestIcon("offscreen", { id: 4 });
    await queue.requestIcon("onscreen", { id: 5 });
    const element = document.createElement("div");
    queue.observeIconTile("onscreen", element);
    notify([{ isIntersecting: true, target: element }]);
    queue.setIconGeneratorApi(viewer.api);
    await flush();

    expect(viewer.captured).toEqual(["5"]);
  });

  it("lets an in-flight capture land before standing down for the inspector", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    await flush();
    expect(viewer.captured).toEqual(["4"]);

    const resume = queue.pauseIconGeneration();
    expect(queue.isIconGeneratorWanted()).toBe(true);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();

    expect(queue.getIconUrl("a")).toBeDefined();
    expect(queue.isIconGeneratorWanted()).toBe(false);
    resume();
  });

  it("retries a capture that died with the generator, rather than losing the item", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    await flush();
    viewer.destroy();
    await flush();

    expect(viewer.captured).toEqual(["4", "4"]);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    expect(queue.getIconUrl("a")).toBeDefined();
  });

  it("stops retrying an item whose captures keep dying, so it cannot hog the queue", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    for (let attempt = 0; attempt < 5; attempt++) {
      await flush();
      viewer.destroy();
      await flush();
    }

    await queue.requestIcon("b", { id: 5 });
    await flush();
    expect(viewer.captured.filter((id) => id === "4")).toHaveLength(3);
    expect(viewer.captured.at(-1)).toBe("5");
  });

  it("stands down while an interactive viewer is on screen", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);
    const resume = queue.pauseIconGeneration();

    await queue.requestIcon("a", { id: 4 });
    await flush();
    expect(viewer.captured).toEqual([]);
    expect(queue.isIconGeneratorWanted()).toBe(false);

    resume();
    await flush();
    expect(viewer.captured).toEqual(["4"]);
  });

  it("remembers a failure about the item, but not one about the moment", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    await flush();
    viewer.reply({ error: "weapon" });
    await flush();
    expect(store.written).toEqual([{ error: "weapon", key: "a" }]);

    await queue.requestIcon("b", { id: 5 });
    await flush();
    viewer.reply({ error: "timeout" });
    await flush();
    expect(store.written).toEqual([{ error: "weapon", key: "a" }]);
  });

  it("fails a capture the viewer only rejects out-of-band, instead of waiting out its timeout", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    await flush();
    expect(viewer.captured).toEqual(["4"]);

    viewer.emit("unsupported", { reason: "keychain" });
    await flush();

    expect(store.written).toEqual([{ error: "keychain", key: "a" }]);

    await queue.requestIcon("b", { id: 5 });
    await flush();
    expect(viewer.captured).toEqual(["4", "5"]);
  });

  it("keeps generating when the viewer reports an unsupported item with nothing in flight", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    viewer.emit("unsupported", { reason: "sticker" });
    await flush();

    await queue.requestIcon("a", { id: 4 });
    await flush();
    expect(viewer.captured).toEqual(["4"]);
    expect(queue.isIconGenerationDisabled()).toBe(false);
  });

  it("gives up for the session when the viewer will not hand back a clean frame", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    await flush();
    viewer.reply({ error: "untrusted" });
    await flush();

    expect(queue.isIconGenerationDisabled()).toBe(true);
    expect(store.written).toEqual([]);

    await queue.requestIcon("b", { id: 5 });
    await flush();
    expect(viewer.captured).toEqual(["4"]);
  });

  it("never stands up a generator for an inventory it already has icons for", async () => {
    const queue = await load();
    store.entries.set("a", { image: new Blob(["x"]) });
    store.entries.set("b", { error: "weapon" });

    await queue.requestIcon("a", { id: 4 });
    await queue.requestIcon("b", { id: 5 });
    await flush();

    expect(queue.isIconGeneratorWanted()).toBe(false);
  });

  it("drops the generator while it waits out a rate limit, rather than idling a context", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    const cooldown = queue.ICON_IDLE_TEARDOWN_MS * 3;

    await queue.requestIcon("a", { id: 4 });
    await flush();
    expect(queue.isIconGeneratorWanted()).toBe(true);

    viewer.emit("rateLimited", { retryAfterMs: cooldown });
    viewer.reply({ error: "timeout" });
    await flush();

    await queue.requestIcon("b", { id: 5 });
    await flush();
    await vi.advanceTimersByTimeAsync(queue.ICON_IDLE_TEARDOWN_MS + 1);
    await flush();

    expect(viewer.captured).toEqual(["4"]);
    expect(queue.isIconGeneratorWanted()).toBe(false);

    await vi.advanceTimersByTimeAsync(cooldown);
    await flush();

    expect(queue.isIconGeneratorWanted()).toBe(true);
    expect(viewer.captured).toEqual(["4", "5"]);
  });

  it("drops the generator once the queue drains, freeing the WebGL context", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    await flush();
    expect(queue.isIconGeneratorWanted()).toBe(true);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    await vi.advanceTimersByTimeAsync(queue.ICON_IDLE_TEARDOWN_MS + 1);
    await flush();

    expect(queue.isIconGeneratorWanted()).toBe(false);
  });
  it("leaves the work to the tab already holding the lock", async () => {
    tabLock.granted = false;
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    await flush();

    expect(viewer.captured).toEqual([]);
    expect(queue.isIconGeneratorWanted()).toBe(false);
  });

  it("serves an already generated icon while another tab holds the lock", async () => {
    tabLock.granted = false;
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);
    store.entries.set("a", { image: new Blob(["x"]) });

    await queue.requestIcon("a", { id: 4 });
    await flush();

    expect(viewer.captured).toEqual([]);
    expect(queue.getIconUrl("a")).toBeDefined();
  });

  it("stops generating while the tab is hidden and resumes when it returns", async () => {
    const setVisibility = stubVisibility("visible");
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    await flush();
    viewer.reply({ image: new Blob(["x"]) });
    await flush();
    expect(viewer.captured).toEqual(["4"]);

    setVisibility("hidden");
    await queue.requestIcon("b", { id: 5 });
    await flush();

    expect(viewer.captured).toEqual(["4"]);
    expect(queue.isIconGeneratorWanted()).toBe(false);

    setVisibility("visible");
    await flush();

    expect(viewer.captured).toEqual(["4", "5"]);
  });

  it("keeps a capture already in flight when the tab hides", async () => {
    const setVisibility = stubVisibility("visible");
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    await flush();
    expect(queue.isIconGeneratorWanted()).toBe(true);

    setVisibility("hidden");
    await flush();
    expect(queue.isIconGeneratorWanted()).toBe(true);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();

    expect(store.written).toEqual([{ key: "a" }]);
    expect(queue.isIconGeneratorWanted()).toBe(false);
  });

  it("renders an edited item before everything already queued", async () => {
    const queue = await load();
    const viewer = fakeApi();

    await queue.requestIcon("a", { id: 4 });
    await queue.requestIcon("b", { id: 5 });
    await queue.requestIcon("c", { id: 6 }, { priority: true });
    queue.setIconGeneratorApi(viewer.api);
    await flush();

    expect(viewer.captured).toEqual(["6"]);
  });

  it("renders the most recent edit first when several are waiting", async () => {
    const queue = await load();
    const viewer = fakeApi();

    await queue.requestIcon("a", { id: 4 });
    await queue.requestIcon("b", { id: 5 }, { priority: true });
    await queue.requestIcon("c", { id: 6 }, { priority: true });
    queue.setIconGeneratorApi(viewer.api);
    await flush();
    expect(viewer.captured).toEqual(["6"]);

    viewer.reply({ image: new Blob(["x"]) });
    await flush();

    expect(viewer.captured).toEqual(["6", "5"]);
  });

  it("tells the tile no icon is coming when the viewer cannot render the item", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);

    await queue.requestIcon("a", { id: 4 });
    await flush();
    expect(queue.isIconUnavailable("a")).toBe(false);

    viewer.reply({ error: "weapon" });
    await flush();

    expect(queue.isIconUnavailable("a")).toBe(true);
    expect(queue.getIconUrl("a")).toBeUndefined();
  });

  it("tells the tile no icon is coming for an item a previous session found unrenderable", async () => {
    const queue = await load();
    const viewer = fakeApi();
    queue.setIconGeneratorApi(viewer.api);
    store.entries.set("a", { error: "weapon" });

    await queue.requestIcon("a", { id: 4 });
    await flush();

    expect(queue.isIconUnavailable("a")).toBe(true);
  });

  it("tells the tile no icon is coming while another tab holds the generator", async () => {
    tabLock.granted = false;
    const queue = await load();

    await queue.requestIcon("a", { id: 4 });
    await flush();

    expect(queue.isIconUnavailable("a")).toBe(true);
  });
});
