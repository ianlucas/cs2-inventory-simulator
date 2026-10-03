/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";

export function useRenamePet() {
  const [renamePet, setRenamePet] = useState<{
    uid: number;
  }>();

  function handleRenamePet(uid: number) {
    return setRenamePet({ uid });
  }

  function closeRenamePet() {
    return setRenamePet(undefined);
  }

  function isRenamingPet(
    state: typeof renamePet
  ): state is NonNullable<typeof renamePet> {
    return state !== undefined;
  }

  return {
    closeRenamePet,
    handleRenamePet,
    isRenamingPet,
    renamePet
  };
}
