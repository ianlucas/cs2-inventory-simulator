/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { english } from "@ianlucas/cs2-lib/translations/english";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { brazilian } from "~/translations/brazilian";
import {
  cacheTranslationFiles,
  serveTranslationFilesInDev
} from "./translation-files.server";

describe("cacheTranslationFiles", () => {
  const app = new Hono()
    .use("/translations/*", cacheTranslationFiles)
    .get("/translations/ui.english.912aa2a.json", (c) => c.json({}));

  it("marks served files as immutable", async () => {
    const response = await app.request("/translations/ui.english.912aa2a.json");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  it("leaves missing files uncached", async () => {
    const response = await app.request("/translations/ui.english.0000000.json");
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });
});

describe("serveTranslationFilesInDev", () => {
  const app = new Hono().use("/translations/*", serveTranslationFilesInDev);

  it("serves UI translations uncached, whatever the hash", async () => {
    const response = await app.request(
      "/translations/ui.brazilian.0000000.json"
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual(brazilian);
  });

  it("serves item translations from cs2-lib", async () => {
    const response = await app.request(
      "/translations/item.english.0000000.json"
    );
    expect(await response.json()).toEqual(english);
  });

  it("passes on unknown languages", async () => {
    const response = await app.request(
      "/translations/item.klingon.0000000.json"
    );
    expect(response.status).toBe(404);
  });
});
