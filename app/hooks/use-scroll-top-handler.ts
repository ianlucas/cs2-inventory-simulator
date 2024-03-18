/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useWatch } from "./use-watch";

export function useScrollTopHandler<T>(dependency: T) {
  useWatch((oldState, newState) => {
    if (
      (oldState === undefined && newState !== undefined) ||
      (oldState !== undefined && newState === undefined)
    ) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, dependency);
}
