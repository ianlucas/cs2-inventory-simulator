/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_InventoryItem,
  CS_NO_STICKER,
  CS_NO_STICKER_WEAR,
  CS_safeValidateSeed,
  CS_safeValidateStatTrak,
  CS_safeValidateWear
} from "@ianlucas/cslib";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "~/db.server";
import { size } from "~/utils/number";

let reporting: string[] = [];

function fixIssues(items: CS_InventoryItem[]) {
  const uids = new Set<number>();
  let fixedIssues = false;
  return {
    items: items
      // Remove non-existent items.
      .filter((item) => CS_Economy.itemMap.has(item.id))
      .map((inventoryItem) => {
        if (inventoryItem.uid !== undefined) {
          uids.add(inventoryItem.uid);
        }
        return inventoryItem;
      })
      .map((inventoryItem, index) => {
        const item = CS_Economy.getById(inventoryItem.id);
        // Item missing uid.
        if (inventoryItem.uid === undefined) {
          fixedIssues = true;
          let uid = 0;
          while (true) {
            if (!uids.has(uid)) {
              inventoryItem.uid = uid;
              uids.add(uid);
              reporting.push(
                `Added uid (${uid}) to inventory item located at ${index}.`
              );
              break;
            }
            uid++;
          }
        }
        // Remove stickers from C4.
        if (
          item.category === "c4" &&
          (inventoryItem.stickers || inventoryItem.stickerswear)
        ) {
          fixedIssues = true;
          inventoryItem.stickers = undefined;
          inventoryItem.stickerswear = undefined;
          reporting.push(
            `Removed stickers from C4 (uid:${inventoryItem.uid}).`
          );
        }
        // Convert NULL to 0 in stickers and stickerswear.
        const isnull = <T>(value: T) => value === null;
        if (
          size(inventoryItem.stickers?.filter(isnull)) > 0 ||
          size(inventoryItem.stickerswear?.filter(isnull)) > 0
        ) {
          fixedIssues = true;
          inventoryItem.stickers = inventoryItem.stickers?.map((sticker) =>
            sticker === null ? CS_NO_STICKER : sticker
          );
          inventoryItem.stickerswear = inventoryItem.stickerswear?.map(
            (stickerwear) =>
              stickerwear === null ? CS_NO_STICKER_WEAR : stickerwear
          );
          reporting.push(
            `Converted NULL to 0 in stickers and stickerswear (uid:${inventoryItem.uid}).`
          );
        }
        // Revert wear to min if it's invalid.
        if (!CS_safeValidateWear(inventoryItem.wear, item)) {
          reporting.push(
            `Reverted wear from ${inventoryItem.wear} to min (${item.wearmin}) (uid:${inventoryItem.uid}).`
          );
          fixedIssues = true;
          inventoryItem.wear = item.wearmin;
        }
        // Remove invalid seeds.
        if (!CS_safeValidateSeed(inventoryItem.seed, item)) {
          reporting.push(`Removed seed from item (uid:${inventoryItem.uid}).`);
          fixedIssues = true;
          inventoryItem.seed = undefined;
        }
        // Remove invalid stattraks.
        if (!CS_safeValidateStatTrak(inventoryItem.stattrak, item)) {
          reporting.push(
            `Removed StatTrak from item (uid:${inventoryItem.uid}).`
          );
          fixedIssues = true;
          inventoryItem.stattrak = undefined;
        }
        // Loop through storage items.
        if (inventoryItem.storage !== undefined) {
          reporting.push(`--Storage unit (uid:${inventoryItem.uid})--`);
          const { items, fixedIssues: fixedStorageIssues } = fixIssues(
            inventoryItem.storage
          );
          if (fixedStorageIssues) {
            fixedIssues = true;
            inventoryItem.storage = items;
            reporting.push(
              `Fixed issues in storage (uid:${inventoryItem.uid}).`
            );
          }
          reporting.push(`--End of storage unit--`);
        }
        return inventoryItem;
      }),
    fixedIssues
  };
}

export async function runUserInventoryCleanUp() {
  let report: string[] = [];
  await prisma.userCache.deleteMany();
  const users = await prisma.user.findMany({
    select: {
      id: true
    }
  });
  for (const { id } of users) {
    const { inventory } = await prisma.user.findUniqueOrThrow({
      select: {
        inventory: true
      },
      where: { id }
    });
    if (inventory) {
      const parsed = JSON.parse(inventory) as CS_InventoryItem[];
      const startMessage = `Cleaning up inventory for user ${id}.`;
      reporting = [];
      reporting.push("-".repeat(startMessage.length));
      reporting.push(startMessage);
      const { items, fixedIssues } = fixIssues(parsed);
      if (fixedIssues) {
        report = [...report, ...reporting];
        await prisma.user.update({
          data: { inventory: JSON.stringify(items) },
          where: { id }
        });
      }
    }
  }

  if (report.length > 0) {
    const path = resolve(process.cwd(), "logs");

    if (!existsSync(path)) {
      mkdirSync(path);
    }

    writeFileSync(
      resolve(path, `user-inventory-clean-up-${Date.now()}.txt`),
      report.join("\n"),
      "utf-8"
    );
  }
}
