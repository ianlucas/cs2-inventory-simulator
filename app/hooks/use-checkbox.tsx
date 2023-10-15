/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useState } from "react";

export function useCheckbox(initialValue: boolean) {
  const [value, setValue] = useState(initialValue);
  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement> | boolean) => {
      setValue(typeof event === "boolean" ? event : event.target.checked);
    },
    []
  );
  return [value, onChange] as const;
}
