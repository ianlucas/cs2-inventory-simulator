/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2Inventory,
  CS2_ITEMS,
  assert,
  ensure
} from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations";
import { prisma } from "~/db.server";

CS2Economy.use({ items: CS2_ITEMS, language: english });

const v0ToV1Key: Record<string, string> = {
  caseid: "containerId",
  nametag: "nameTag",
  stattrak: "statTrak",
  updatedat: "updatedAt"
};

function assertV0Item(v0: any, v1: any, inStorageUnit = false) {
  for (let [key, value] of Object.entries<any>(v0)) {
    if (key === "uid") continue;
    const uid = v0.uid as number;
    switch (key) {
      case "equipped":
      case "equippedCT":
      case "equippedT":
        if (CS2Economy.get(v0.id).isPatch()) {
          value = undefined;
        }
        break;
      case "stickers":
        value.forEach((stickerId: any, index: number) => {
          assert(
            // @ts-ignore
            v1[uid].stickers[index]?.id ===
              (stickerId === 0 ? undefined : stickerId),
            `Sticker ${JSON.stringify(v1[uid].stickers)} != ${stickerId} (${index}).`
          );
        });
        continue;

      case "stickerswear":
        value.forEach((wear: any, index: number) => {
          assert(
            // @ts-ignore
            v1[uid].stickers[index]?.wear ===
              (wear === 0 || v0.stickers[index] === 0 ? undefined : wear)
          );
        });
        continue;

      case "storage":
        assert(!inStorageUnit);
        value.forEach((inV0: any) => assertV0Item(inV0, v1[uid].storage, true));
        continue;
    }
    // @ts-ignore
    assert(v1[uid][v0ToV1Key[key] ?? key] === value, `Key ${key} failed.`);
  }
}

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      inventory: true
    }
  });

  for (const { id, inventory } of users) {
    if (inventory === null) continue;
    const v0Items = JSON.parse(inventory);
    const v1 = ensure(CS2Inventory.parse(inventory));
    assert(v1.version === 1, "Script for v0 to v1.");
    for (const v0 of v0Items) {
      try {
        assertV0Item(v0, v1.items);
      } catch (error) {
        console.log(`User ${id} inventory item ${v0.uid} failed.`);
        throw error;
      }
    }
  }

  console.log("Assert completed successfully.");
}

main();
