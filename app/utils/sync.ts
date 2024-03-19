/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  ActionShape,
  ApiActionSyncData,
  ApiActionSyncUrl
} from "~/routes/api.action.sync._index";
import { postJson } from "./fetch";
import { fail } from "./misc";

const queue: ActionShape[] = [];

export const syncState = { syncedAt: 0 };
export const syncEvents = new (class SyncEvents extends EventTarget {})();

export function sync(data: ActionShape) {
  queue.push(data);
}

export function dispatchSyncFail() {
  while (queue[0]) {
    queue.pop();
  }
  syncEvents.dispatchEvent(new Event("syncfail"));
}

async function doSync() {
  let actions = [] as typeof queue;
  while (queue[0]) {
    actions.push(queue.shift()!);
  }
  syncEvents.dispatchEvent(new Event("syncstart"));
  if (actions.length > 0) {
    try {
      const response = await postJson<ApiActionSyncData>(ApiActionSyncUrl, {
        actions,
        syncedAt: syncState.syncedAt
      });
      if (typeof response?.syncedAt !== "number") {
        fail("Sync error.");
      }
      syncState.syncedAt = response.syncedAt;
    } catch {
      dispatchSyncFail();
    }
  }
  syncEvents.dispatchEvent(new Event("syncend"));
  setTimeout(doSync, 1000 / 3);
}

doSync();
