/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ChangeEvent, useState } from "react";

export function useKeyValues<T extends {}>(initialState: T) {
  const [value, setValue] = useState(initialState);
  return {
    value,

    update(key: keyof T) {
      return function handler(value: T[keyof T]) {
        setValue((current) => ({
          ...current,
          [key]: value
        }));
      };
    },

    input(key: keyof T) {
      return function handler(event: ChangeEvent<HTMLInputElement>) {
        setValue((current) => ({
          ...current,
          [key]: event.target.value
        }));
      };
    },

    checkbox(key: keyof T) {
      return function handler(event: ChangeEvent<HTMLInputElement>) {
        setValue((current) => ({
          ...current,
          [key]: event.target.checked
        }));
      };
    }
  };
}
