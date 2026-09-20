/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const urls = new Map<string, string>();
const unavailable = new Set<string>();
const listeners = new Map<string, Set<() => void>>();

function notify(key: string): void {
  for (const listener of listeners.get(key) ?? []) {
    listener();
  }
}

export function subscribeIcon(key: string, listener: () => void): () => void {
  let entry = listeners.get(key);
  if (entry === undefined) {
    entry = new Set();
    listeners.set(key, entry);
  }
  entry.add(listener);
  return () => {
    entry.delete(listener);
    if (entry.size === 0) {
      listeners.delete(key);
    }
  };
}

export function getIconUrl(key: string): string | undefined {
  return urls.get(key);
}

export function getIconUrlServer(): undefined {
  return undefined;
}

export function isIconUnavailable(key: string): boolean {
  return unavailable.has(key);
}

export function isIconUnavailableServer(): boolean {
  return false;
}

export function hasIcon(key: string): boolean {
  return urls.has(key);
}

function revoke(key: string): void {
  const url = urls.get(key);
  if (url === undefined) {
    return;
  }
  URL.revokeObjectURL(url);
  urls.delete(key);
}

export function publishIcon(key: string, image: Blob | undefined): void {
  if (image === undefined) {
    unavailable.add(key);
  } else {
    revoke(key);
    urls.set(key, URL.createObjectURL(image));
    unavailable.delete(key);
  }
  notify(key);
}

export function markIconUnavailable(key: string): void {
  publishIcon(key, undefined);
}

export function retractIconUnavailable(key: string): void {
  if (!unavailable.delete(key)) {
    return;
  }
  notify(key);
}

export function releaseIcon(key: string): void {
  revoke(key);
  unavailable.delete(key);
  notify(key);
}
