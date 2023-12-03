/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionShape, ApiActionSync } from "~/routes/api.action.sync._index";

const queue: ActionShape[] = [];

export async function sync(data: ActionShape) {
  queue.push(data);
}

async function doSync() {
  let actions = [] as typeof queue;
  while (queue[0]) {
    actions.push(queue.shift()!);
  }
  if (actions.length > 0) {
    await fetch(ApiActionSync, {
      method: "POST",
      body: JSON.stringify(actions)
    });
  }

  setTimeout(doSync, 1000 / 3);
}

doSync();
