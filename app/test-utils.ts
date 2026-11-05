/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ensure } from "@ianlucas/cs2-lib";

export function dragRange(input: HTMLInputElement, ticks: number) {
  const environment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const wasActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
  const setValue = ensure(
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  );
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
      setValue.call(input, String(Number(input.min) + step * (1 + (tick % 2))));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  } finally {
    window.removeEventListener("error", onError);
    environment.IS_REACT_ACT_ENVIRONMENT = wasActEnvironment;
  }
  return errors;
}
