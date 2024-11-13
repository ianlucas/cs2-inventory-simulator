/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useLoaderData } from "@remix-run/react";

export type SerializeFrom<T> = ReturnType<typeof useLoaderData<T>>;

export function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function safeParseJson(json: string): any {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

export function deleteEmptyProps(obj: any) {
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  }
}

export function has(str?: string) {
  return (str?.length ?? 0) > 0;
}

export function isOurHostname() {
  return ["inventory.cstrike.app", "localhost"].includes(
    window.location.hostname
  );
}

export function colorText(input: string) {
  return input.replace(/{(\w+)}([^{}]*)/g, (_, color, text) => {
    return `<span style="color: ${color};">${text}</span>`;
  });
}

export function noop() {}

export function json<T>(data: T, init?: ResponseInit) {
  // todo: `Response.json` is not working for some reason.
  return new Response(JSON.stringify(data), init);
}
