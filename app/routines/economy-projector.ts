/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "~/db.server";
import {
  ensureInventoryProjectionState,
  INVENTORY_PROJECTION_STATE_ID
} from "~/models/inventory-projection-state.server";
import { logError } from "~/shared/monitoring";
import { singleton } from "~/singleton.server";

const ECONOMY_PROJECTION_VERSION = 1;

let cs2LibVersion: string | undefined;
function getCs2LibVersion() {
  if (cs2LibVersion === undefined) {
    const entry = fileURLToPath(import.meta.resolve("@ianlucas/cs2-lib"));
    const packageJson = readFileSync(
      join(dirname(entry), "..", "package.json"),
      "utf8"
    );
    cs2LibVersion = (JSON.parse(packageJson) as { version: string }).version;
  }
  return cs2LibVersion;
}

function projectEconomyItems() {
  return CS2Economy.itemsAsArray.map((item) => ({
    altName: item.alternateName,
    base: item.isBase ?? false,
    baseItemId: item.parentId,
    category: item.categoryName,
    collectionKey: item.collectionKey,
    def: item.definitionIndex,
    free: item.isDefault ?? false,
    id: item.id,
    modelKey: item.modelKey,
    name: item.name,
    rarityColor: item.rarityColor,
    type: item.type
  }));
}

/**
 * Rebuilds the `EconomyItem` table when the stored projection doesn't match the
 * loaded cs2-lib or `ECONOMY_PROJECTION_VERSION`. Both only change with a
 * deploy, so this runs once per process.
 */
export class EconomyProjector {
  private projection: Promise<boolean> | undefined;

  start() {
    void this.run();
  }

  /**
   * Waits for the projection run, starting it if needed, and reports whether
   * the stored economy items match the loaded cs2-lib.
   */
  isCurrentAfterRun() {
    return this.run();
  }

  private run() {
    this.projection ??= this.project().then(
      () => true,
      (error) => {
        logError("Economy projection: failed.", { error });
        return false;
      }
    );
    return this.projection;
  }

  private async project() {
    const version = getCs2LibVersion();
    const state = await ensureInventoryProjectionState();
    if (
      state.cs2LibVersion === version &&
      state.economyProjectionVersion === ECONOMY_PROJECTION_VERSION
    ) {
      return;
    }
    const items = projectEconomyItems();
    await prisma.$transaction(
      async (tx) => {
        await tx.economyItem.deleteMany();
        for (let index = 0; index < items.length; index += 1_000) {
          await tx.economyItem.createMany({
            data: items.slice(index, index + 1_000)
          });
        }
        await tx.inventoryProjectionState.update({
          data: {
            cs2LibVersion: version,
            economyProjectionVersion: ECONOMY_PROJECTION_VERSION
          },
          where: { id: INVENTORY_PROJECTION_STATE_ID }
        });
        await tx.economyPriceSyncState.updateMany({
          data: { lastSucceededSourceDate: null }
        });
      },
      { maxWait: 30_000, timeout: 180_000 }
    );
  }
}

export const economyProjector = singleton(
  "economyProjector",
  () => new EconomyProjector()
);
