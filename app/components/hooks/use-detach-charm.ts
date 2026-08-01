/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";

export function useDetachCharm() {
  const [detachCharm, setDetachCharm] = useState<{
    uid: number;
  }>();

  function handleDetachCharm(uid: number) {
    return setDetachCharm({ uid });
  }

  function closeDetachCharm() {
    return setDetachCharm(undefined);
  }

  function isDetachingCharm(
    state: typeof detachCharm
  ): state is NonNullable<typeof detachCharm> {
    return state !== undefined;
  }

  return {
    closeDetachCharm,
    detachCharm,
    handleDetachCharm,
    isDetachingCharm
  };
}
