/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { sync } from "~/sync";

export function useIsSyncing() {
  const [isSyncing, setIsSyncing] = useState(sync.isSyncing);
  useEffect(() => {
    function handleSyncStart() {
      setIsSyncing(true);
    }
    function handleSyncIdle() {
      setIsSyncing(false);
    }
    sync.addEventListener("syncstart", handleSyncStart);
    sync.addEventListener("syncidle", handleSyncIdle);
    return () => {
      sync.removeEventListener("syncstart", handleSyncStart);
      sync.removeEventListener("syncidle", handleSyncIdle);
    };
  });
  return isSyncing;
}
