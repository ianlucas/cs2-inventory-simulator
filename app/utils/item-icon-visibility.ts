/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const elementKeys = new WeakMap<Element, string>();
const intersecting = new Map<string, Set<Element>>();
const listeners = new Set<() => void>();
let observer: IntersectionObserver | undefined;

export function subscribeIconTileVisibility(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isIconTileVisible(key: string): boolean {
  return intersecting.has(key);
}

function setIntersecting(
  key: string,
  element: Element,
  isIntersecting: boolean
): boolean {
  const elements = intersecting.get(key);
  if (isIntersecting) {
    if (elements === undefined) {
      intersecting.set(key, new Set([element]));
      return true;
    }
    elements.add(element);
    return false;
  }
  if (elements === undefined || !elements.delete(element)) {
    return false;
  }
  if (elements.size > 0) {
    return false;
  }
  intersecting.delete(key);
  return true;
}

function ensureObserver(): IntersectionObserver | undefined {
  if (typeof IntersectionObserver === "undefined") {
    return undefined;
  }
  observer ??= new IntersectionObserver((entries) => {
    let changed = false;
    for (const { target, isIntersecting } of entries) {
      const key = elementKeys.get(target);
      if (key !== undefined && setIntersecting(key, target, isIntersecting)) {
        changed = true;
      }
    }
    if (!changed) {
      return;
    }
    for (const listener of listeners) {
      listener();
    }
  });
  return observer;
}

export function observeIconTile(key: string, element: Element): () => void {
  const active = ensureObserver();
  if (active === undefined) {
    return () => {};
  }
  elementKeys.set(element, key);
  active.observe(element);
  return () => {
    active.unobserve(element);
    setIntersecting(key, element, false);
    elementKeys.delete(element);
  };
}
