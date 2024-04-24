/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  ActionShape,
  ApiActionSyncData,
  ApiActionSyncUrl
} from "~/routes/api.action.sync._index";
import { postJson } from "./utils/fetch";
import { fail } from "./utils/misc";

export const sync = new (class Sync extends EventTarget {
  isSyncing = false;
  queue: ActionShape[] = [];
  syncedAt = 0;
})();

export function pushToSync(data: ActionShape) {
  sync.queue.push(data);
}

export function dispatchSyncError() {
  while (sync.queue[0]) {
    sync.queue.pop();
  }
  sync.dispatchEvent(new Event("syncerror"));
}

async function doSync() {
  let actions = [] as typeof sync.queue;
  while (sync.queue[0]) {
    actions.push(sync.queue.shift()!);
  }
  sync.dispatchEvent(new Event("syncstart"));
  if (actions.length > 0) {
    try {
      sync.isSyncing = true;
      const response = await postJson<ApiActionSyncData>(ApiActionSyncUrl, {
        actions,
        syncedAt: sync.syncedAt
      });
      if (typeof response?.syncedAt !== "number") {
        fail("Sync error.");
      }
      sync.syncedAt = response.syncedAt;
    } catch {
      dispatchSyncError();
    }
  }
  sync.dispatchEvent(new Event("syncend"));
  if (sync.queue.length === 0) {
    sync.isSyncing = false;
    sync.dispatchEvent(new Event("syncidle"));
  }
  setTimeout(doSync, 1000 / 3);
}

doSync();
