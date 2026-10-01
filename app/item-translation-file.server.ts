/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type {
  CS2ItemTranslation,
  CS2ItemTranslationMap
} from "@ianlucas/cs2-lib";
import { open } from "node:fs/promises";

// The index holds two little-endian uint32s per item id: the byte offset and
// byte length of the item's value in the JSON file. A zero length means the
// item has no translation.
const INDEX_ENTRY_SIZE = 8;

export function encodeItemTranslationMap(map: CS2ItemTranslationMap) {
  const entries = Object.entries(map).flatMap(([key, value]) =>
    value !== undefined ? [[Number(key), value] as const] : []
  );
  const maxId = entries.reduce((max, [id]) => Math.max(max, id), -1);
  const index = Buffer.alloc((maxId + 1) * INDEX_ENTRY_SIZE);
  const chunks: Buffer[] = [];
  let offset = 0;
  function append(text: string) {
    const chunk = Buffer.from(text);
    chunks.push(chunk);
    offset += chunk.length;
    return chunk.length;
  }
  append("{");
  entries.forEach(([id, value], position) => {
    append(`${position > 0 ? "," : ""}"${id}":`);
    index.writeUInt32LE(offset, id * INDEX_ENTRY_SIZE);
    index.writeUInt32LE(
      append(JSON.stringify(value)),
      id * INDEX_ENTRY_SIZE + 4
    );
  });
  append("}");
  return { json: Buffer.concat(chunks), index };
}

export async function readItemTranslation(
  jsonPath: string,
  indexPath: string,
  id: number
): Promise<CS2ItemTranslation | undefined> {
  const entry = await readBytes(
    indexPath,
    id * INDEX_ENTRY_SIZE,
    INDEX_ENTRY_SIZE
  );
  if (entry.length < INDEX_ENTRY_SIZE) {
    return undefined;
  }
  const length = entry.readUInt32LE(4);
  if (length === 0) {
    return undefined;
  }
  const value = await readBytes(jsonPath, entry.readUInt32LE(0), length);
  return JSON.parse(value.toString());
}

// Dev has no built files, so it reads translations straight from cs2-lib.
export async function loadItemTranslationMap(
  language: string
): Promise<CS2ItemTranslationMap> {
  const module = await import(
    /* @vite-ignore */ `@ianlucas/cs2-lib/translations/${language}`
  );
  return module[language];
}

async function readBytes(path: string, position: number, length: number) {
  const file = await open(path);
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await file.read(buffer, 0, length, position);
    return buffer.subarray(0, bytesRead);
  } finally {
    await file.close();
  }
}
