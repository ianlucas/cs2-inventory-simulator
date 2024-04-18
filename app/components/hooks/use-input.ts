/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useState } from "react";

export function useInput(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement> | string) => {
      setValue(typeof event === "string" ? event : event.target.value);
    },
    []
  );
  return [value, onChange] as const;
}
