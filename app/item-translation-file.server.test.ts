/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CS2ItemTranslationMap } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { thai } from "@ianlucas/cs2-lib/translations/thai";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  encodeItemTranslationMap,
  readItemTranslation
} from "./item-translation-file.server";

let directory: string;

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "item-translation-file-"));
});

afterAll(async () => {
  await rm(directory, { recursive: true });
});

async function writeItemTranslationFile(
  name: string,
  map: CS2ItemTranslationMap
) {
  const { json, index } = encodeItemTranslationMap(map);
  const jsonPath = join(directory, `${name}.json`);
  const indexPath = join(directory, `${name}.idx`);
  await writeFile(jsonPath, json);
  await writeFile(indexPath, index);
  return { jsonPath, indexPath };
}

// Thai covers multi-byte characters, where byte and string offsets differ.
describe.each([
  ["english", english],
  ["thai", thai]
])("%s", (name, map) => {
  it("encodes the map as JSON", () => {
    const { json } = encodeItemTranslationMap(map);
    expect(JSON.parse(json.toString())).toEqual(map);
  });

  it("reads every item back through the index", async () => {
    const { jsonPath, indexPath } = await writeItemTranslationFile(name, map);
    const translations: CS2ItemTranslationMap = {};
    for (const id of Object.keys(map)) {
      translations[id] = await readItemTranslation(
        jsonPath,
        indexPath,
        Number(id)
      );
    }
    expect(translations).toEqual(map);
  });
});

it("reads nothing for ids without a translation", async () => {
  const { jsonPath, indexPath } = await writeItemTranslationFile("sparse", {
    1: { name: "One" },
    3: { name: "Three" }
  });
  expect(await readItemTranslation(jsonPath, indexPath, 0)).toBeUndefined();
  expect(await readItemTranslation(jsonPath, indexPath, 2)).toBeUndefined();
  expect(await readItemTranslation(jsonPath, indexPath, 4)).toBeUndefined();
  expect(await readItemTranslation(jsonPath, indexPath, 3)).toEqual({
    name: "Three"
  });
});
