/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { getCachedInventoryData } from "./inventory-storage";
import {
  getFromLocalStorage,
  getTypedFromLocalStorage,
  removeFromLocalStorage,
  setToLocalStorage
} from "./local-storage";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function denyStorageAccess() {
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new DOMException(
      "Failed to read the 'localStorage' property from 'Window': Access is denied for this document.",
      "SecurityError"
    );
  });
}

test("reads, writes and removes values", () => {
  setToLocalStorage("key", "value");
  expect(getFromLocalStorage("key")).toBe("value");
  removeFromLocalStorage("key");
  expect(getFromLocalStorage("key")).toBeNull();
});

test("treats denied storage access as empty storage", () => {
  denyStorageAccess();
  expect(getFromLocalStorage("key")).toBeUndefined();
  expect(getTypedFromLocalStorage("key", 1)).toBe(1);
  expect(() => setToLocalStorage("key", "value")).not.toThrow();
  expect(() => removeFromLocalStorage("key")).not.toThrow();
  expect(getCachedInventoryData()).toBeUndefined();
});

test("ignores writes that exceed the storage quota", () => {
  vi.spyOn(window, "localStorage", "get").mockReturnValue({
    ...window.localStorage,
    setItem() {
      throw new DOMException(
        "The quota has been exceeded.",
        "QuotaExceededError"
      );
    }
  });
  expect(() => setToLocalStorage("key", "value")).not.toThrow();
});
