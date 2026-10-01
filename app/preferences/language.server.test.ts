/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createSession } from "react-router";
import { expect, it, vi } from "vitest";
import { getLanguage } from "./language.server";

vi.mock("~/models/rule.server", () => ({
  appCountry: { get: async () => "us" }
}));

it("reads the item language from the session", async () => {
  const session = createSession({
    itemLanguage: "english",
    language: "brazilian"
  });
  expect(await getLanguage(session, null)).toEqual({
    itemLanguage: "english",
    lang: "pt-BR",
    language: "brazilian"
  });
});

it("follows the interface language without an item language", async () => {
  for (const itemLanguage of [undefined, null, ""]) {
    const session = createSession({ itemLanguage, language: "brazilian" });
    expect((await getLanguage(session, null)).itemLanguage).toBeNull();
  }
});
