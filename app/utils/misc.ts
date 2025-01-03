/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useLoaderData } from "react-router";

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

export function trim(value: string) {
  value = value.trim();
  return value.length > 0 ? value : undefined;
}

export function noempty(value: string | undefined) {
  return value !== undefined
    ? value.length > 0
      ? value
      : undefined
    : undefined;
}
