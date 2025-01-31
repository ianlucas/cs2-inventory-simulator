import { useState } from "react";

export function useKeyValue<T extends {}>(initialState: T) {
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
        return function handler(event: React.ChangeEvent<HTMLInputElement>) {
          setState((current) => ({
            ...current,
            [key]: event.target.value
          }));
        };
      },

      checkbox(key: keyof T) {
        return function handler(event: React.ChangeEvent<HTMLInputElement>) {
          setState((current) => ({
            ...current,
            [key]: event.target.checked
          }));
        };
      }
    }
  ] as const;
}
