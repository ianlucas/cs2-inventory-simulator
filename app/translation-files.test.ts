/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, it } from "vitest";
import {
  getTranslationFileName,
  parseTranslationFileName
} from "./translation-files";

it("parses the file names it builds", () => {
  expect(
    parseTranslationFileName(
      getTranslationFileName("item", "brazilian", "f7d2ab8")
    )
  ).toEqual({ kind: "item", language: "brazilian" });
  expect(
    parseTranslationFileName(getTranslationFileName("ui", "thai", "912aa2a"))
  ).toEqual({ kind: "ui", language: "thai" });
});

it("rejects other file names", () => {
  for (const fileName of [
    getTranslationFileName("item", "english", "f7d2ab8", "idx"),
    "font.english.f7d2ab8.json",
    "ui.english.json",
    "ui.../english.f7d2ab8.json"
  ]) {
    expect(parseTranslationFileName(fileName)).toBeUndefined();
  }
});
