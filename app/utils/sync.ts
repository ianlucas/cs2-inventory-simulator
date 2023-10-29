/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const queue: [string, any][] = [];

export async function sync(url: string, data: any) {
  queue.push([url, data]);
}

async function doSync() {
  while (queue[0]) {
    const [url, data] = queue.shift()!;
    await fetch(url, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  setTimeout(doSync, 1000 / 64);
}

doSync();
