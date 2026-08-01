/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";

export function useUnsealGraffiti() {
  const [unsealGraffiti, setUnsealGraffiti] = useState<{
    uid: number;
  }>();

  function handleUnsealGraffiti(uid: number) {
    return setUnsealGraffiti({ uid });
  }

  function closeUnsealGraffiti() {
    return setUnsealGraffiti(undefined);
  }

  function isUnsealingGraffiti(
    state: typeof unsealGraffiti
  ): state is NonNullable<typeof unsealGraffiti> {
    return state !== undefined;
  }

  return {
    closeUnsealGraffiti,
    handleUnsealGraffiti,
    isUnsealingGraffiti,
    unsealGraffiti
  };
}
