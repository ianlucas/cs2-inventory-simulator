/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useRootContext } from "~/components/root-context";

export function useTranslation() {
  const { translation } = useRootContext();
  return function translate(
    token: string,
    defaultValue?: string,
    ...values: string[]
  ) {
    token = token.replace(/\s/g, "");
    const value = translation[token];
    if (value === undefined) {
      return defaultValue || "???";
    }
    return value.replace(/\{(\d+)\}/g, (_, index) => values[Number(index) - 1]);
  };
}
