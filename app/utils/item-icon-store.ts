/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ICON_CACHE_VERSION } from "./item-icon";
import type { ViewerCaptureError } from "./viewer-api";

const DATABASE_NAME = "cs2-inventory-simulator-icons";
const STORE_NAME = "icons";
const USED_AT_INDEX = "usedAt";

export const MAX_STORED_ICONS = 512;

export interface IconEntry {
  key: string;
  image?: Blob;
  error?: ViewerCaptureError;
  retryAfter?: number;
  usedAt: number;
}

let database: Promise<IDBDatabase | undefined> | undefined;

function request<T>(source: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    source.onsuccess = () => resolve(source.result);
    source.onerror = () => reject(source.error ?? new Error("IndexedDB error"));
  });
}

function open(): Promise<IDBDatabase | undefined> {
  if (database !== undefined) {
    return database;
  }
  database = new Promise<IDBDatabase | undefined>((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(undefined);
      return;
    }
    let opening: IDBOpenDBRequest;
    try {
      opening = indexedDB.open(DATABASE_NAME, ICON_CACHE_VERSION);
    } catch {
      resolve(undefined);
      return;
    }
    opening.onupgradeneeded = () => {
      const db = opening.result;
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
      store.createIndex(USED_AT_INDEX, USED_AT_INDEX);
    };
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => resolve(undefined);
    opening.onblocked = () => resolve(undefined);
  });
  return database;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => Promise<T>,
  fallback: T
): Promise<T> {
  const db = await open();
  if (db === undefined) {
    return fallback;
  }
  try {
    return await run(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
  } catch {
    return fallback;
  }
}

export function readIcon(key: string): Promise<IconEntry | undefined> {
  return withStore(
    "readwrite",
    async (store) => {
      const entry = (await request(store.get(key))) as IconEntry | undefined;
      if (entry !== undefined) {
        store.put({ ...entry, usedAt: Date.now() });
      }
      return entry;
    },
    undefined
  );
}

function putIcon(entry: Omit<IconEntry, "usedAt">): Promise<void> {
  return withStore(
    "readwrite",
    async (store) => {
      await request(store.put({ ...entry, usedAt: Date.now() }));
    },
    undefined
  );
}

export function writeIcon(key: string, image: Blob): Promise<void> {
  return putIcon({ key, image });
}

export function writeIconFailure(
  key: string,
  error: ViewerCaptureError,
  retryAfter?: number
): Promise<void> {
  return putIcon(
    retryAfter === undefined ? { key, error } : { key, error, retryAfter }
  );
}

export function pruneIcons(max = MAX_STORED_ICONS): Promise<void> {
  return withStore(
    "readwrite",
    async (store) => {
      const total = await request(store.count());
      let excess = total - max;
      if (excess <= 0) {
        return;
      }
      await new Promise<void>((resolve, reject) => {
        const cursorRequest = store.index(USED_AT_INDEX).openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (cursor === null || excess <= 0) {
            resolve();
            return;
          }
          cursor.delete();
          excess--;
          cursor.continue();
        };
        cursorRequest.onerror = () =>
          reject(cursorRequest.error ?? new Error("IndexedDB error"));
      });
    },
    undefined
  );
}
