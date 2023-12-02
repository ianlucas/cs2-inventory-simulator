/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ApiActionSync } from "~/routes/api.action.sync._index";

const queue: [string, any][] = [];

export async function sync(type: string, data: any) {
  queue.push([type, data]);
}

async function doSync() {
  let actions = [] as { type: string; data: string }[];
  while (queue[0]) {
    const [type, data] = queue.shift()!;
    actions.push({ type, ...data });
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
