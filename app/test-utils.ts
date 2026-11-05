/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2_ITEMS, ensure } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach } from "vitest";

const environment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
environment.IS_REACT_ACT_ENVIRONMENT = true;

export function loadEconomy() {
  CS2Economy.load({ items: CS2_ITEMS, language: english });
}

export interface TestRoot {
  container: HTMLElement;
  render(node: ReactNode): void;
  root: Root;
}

export function setupTestRoot() {
  const view = {
    render(node: ReactNode) {
      act(() => view.root.render(node));
    }
  } as TestRoot;
  beforeEach(() => {
    view.container = document.createElement("div");
    document.body.appendChild(view.container);
    view.root = createRoot(view.container);
  });
  afterEach(() => {
    act(() => view.root.unmount());
    view.container.remove();
  });
  return view;
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, reject, resolve };
}

export function nextMacrotask() {
  return new Promise((resolve) => setTimeout(resolve));
}

export function setInputValue(input: HTMLInputElement, value: string) {
  ensure(
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  ).call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function dragRange(input: HTMLInputElement, ticks: number) {
  const wasActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
  const step = Number(input.step) || 1;
  const errors: unknown[] = [];
  const onError = (event: ErrorEvent) => {
    errors.push(event.error);
    event.preventDefault();
  };
  environment.IS_REACT_ACT_ENVIRONMENT = false;
  window.addEventListener("error", onError);
  try {
    for (let tick = 0; tick < ticks; tick++) {
      setInputValue(input, String(Number(input.min) + step * (1 + (tick % 2))));
    }
  } finally {
    window.removeEventListener("error", onError);
    environment.IS_REACT_ACT_ENVIRONMENT = wasActEnvironment;
  }
  return errors;
}
