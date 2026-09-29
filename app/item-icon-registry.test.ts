/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Registry = typeof import("./item-icon-registry");

const revoked: string[] = [];
let nextUrl = 0;

async function load(): Promise<Registry> {
  vi.resetModules();
  return await import("./item-icon-registry");
}

beforeEach(() => {
  revoked.length = 0;
  nextUrl = 0;
  URL.createObjectURL = () => `blob:${nextUrl++}`;
  URL.revokeObjectURL = (url: string) => {
    revoked.push(url);
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("icon registry", () => {
  it("frees the object URL a regenerated key replaces", async () => {
    const registry = await load();

    registry.publishIcon("a", new Blob(["x"]));
    const first = registry.getIconUrl("a");
    registry.publishIcon("a", new Blob(["y"]));

    expect(first).toBe("blob:0");
    expect(registry.getIconUrl("a")).toBe("blob:1");
    expect(revoked).toEqual(["blob:0"]);
  });

  it("frees the object URL of an icon nothing can draw any more", async () => {
    const registry = await load();
    registry.publishIcon("a", new Blob(["x"]));

    registry.releaseIcon("a");

    expect(revoked).toEqual(["blob:0"]);
    expect(registry.getIconUrl("a")).toBeUndefined();
    expect(registry.hasIcon("a")).toBe(false);
  });

  it("tells a tile an icon is coming again once another tab stops generating", async () => {
    const registry = await load();
    const seen: string[] = [];
    registry.subscribeIcon("a", () => seen.push("notified"));

    registry.markIconUnavailable("a");
    expect(registry.isIconUnavailable("a")).toBe(true);

    registry.retractIconUnavailable("a");

    expect(registry.isIconUnavailable("a")).toBe(false);
    expect(seen).toHaveLength(2);
  });

  it("stops saying no icon is coming once a frame arrives", async () => {
    const registry = await load();

    registry.markIconUnavailable("a");
    registry.publishIcon("a", new Blob(["x"]));

    expect(registry.isIconUnavailable("a")).toBe(false);
  });
});
