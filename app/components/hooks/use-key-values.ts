/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ChangeEvent, useState } from "react";

export function useKeyValues<T extends {}>(initialState: T) {
  const [state, setState] = useState(initialState);
  return [
    state,
    {
      update(key: keyof T) {
        return function handler(value: T[keyof T]) {
          setState((current) => ({
            ...current,
            [key]: value
          }));
        };
      },

      input(key: keyof T) {
        return function handler(event: ChangeEvent<HTMLInputElement>) {
          setState((current) => ({
            ...current,
            [key]: event.target.value
          }));
        };
      },

      checkbox(key: keyof T) {
        return function handler(event: ChangeEvent<HTMLInputElement>) {
          setState((current) => ({
            ...current,
            [key]: event.target.checked
          }));
        };
      }
    }
  ] as const;
}
