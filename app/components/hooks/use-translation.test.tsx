/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useTranslation } from "./use-translation";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const api = vi.hoisted(() => ({
  fetchItemTranslationMap: vi.fn(async (language: string) => ({
    4: { name: `AK-47 (${language})` }
  })),
  fetchSystemTranslationMap: vi.fn(async (language: string) => ({
    SettingsLanguage: `Language (${language})`
  }))
}));

vi.mock("~/translation-api.client", () => api);

type Languages = Parameters<typeof useTranslation>[0];

let root: Root;
let translation: ReturnType<typeof useTranslation>;

function Probe(languages: Languages) {
  translation = useTranslation(languages);
  return null;
}

async function render(languages: Languages) {
  await act(async () => {
    root.render(<Probe {...languages} />);
  });
}

beforeEach(() => {
  root = createRoot(document.createElement("div"));
  vi.clearAllMocks();
});

afterEach(() => {
  act(() => root.unmount());
});

it("loads each map in its own language", async () => {
  await render({ itemLanguage: "english", language: "brazilian" });
  expect(translation.translate("SettingsLanguage")).toBe(
    "Language (brazilian)"
  );
  expect(translation.items[4]?.name).toBe("AK-47 (english)");
});

it("refetches only the map whose language changed", async () => {
  await render({ itemLanguage: "english", language: "brazilian" });
  vi.clearAllMocks();

  await render({ itemLanguage: "german", language: "brazilian" });
  expect(api.fetchItemTranslationMap).toHaveBeenCalledExactlyOnceWith("german");
  expect(api.fetchSystemTranslationMap).not.toHaveBeenCalled();

  await render({ itemLanguage: "german", language: "french" });
  expect(api.fetchSystemTranslationMap).toHaveBeenCalledExactlyOnceWith(
    "french"
  );
  expect(api.fetchItemTranslationMap).toHaveBeenCalledTimes(1);
});
