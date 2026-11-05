/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ChangeEvent, SetStateAction, useRef, useState } from "react";

export function useKeyValues<T extends object>(
  initialState: T,
  onChange?: (value: T) => void
) {
  const [value, setState] = useState(initialState);
  const latestRef = useRef(initialState);

  function apply(action: SetStateAction<T>, notify: boolean) {
    const next =
      typeof action === "function"
        ? (action as (current: T) => T)(latestRef.current)
        : action;
    latestRef.current = next;
    setState(next);
    if (notify) {
      onChange?.(next);
    }
  }

  function setValue(action: SetStateAction<T>) {
    apply(action, true);
  }

  return {
    value,
    setValue,

    setValueSilently(next: T) {
      apply(next, false);
    },

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
    },

    reset() {
      setValue(initialState);
    }
  };
}
