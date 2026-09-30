/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "~/db.server";
import type { EconomyItem } from "~/generated/prisma/client";
import { logError } from "~/shared/monitoring";
import { singleton } from "~/singleton.server";

const ECONOMY_PROJECTION_VERSION = 1;
const STATE_ID = 1;

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

async function ensureState() {
  // Prisma runs an upsert with an empty update as read-then-insert, which races
  // between processes overlapping on a deploy; skipDuplicates uses ON CONFLICT.
  await prisma.economyProjectionState.createMany({
    data: { id: STATE_ID },
    skipDuplicates: true
  });
  return await prisma.economyProjectionState.findUniqueOrThrow({
    where: { id: STATE_ID }
  });
}

function projectEconomyItems() {
  // Missing values are null: Prisma's update leaves undefined fields unchanged.
  return CS2Economy.itemsAsArray.map((item) => ({
    altName: item.alternateName ?? null,
    base: item.isBase ?? false,
    baseItemId: item.parentId ?? null,
    category: item.categoryName ?? null,
    collectionKey: item.collectionKey ?? null,
    def: item.definitionIndex ?? null,
    free: item.isDefault ?? false,
    id: item.id,
    modelKey: item.modelKey ?? null,
    name: item.name,
    rarityColor: item.rarityColor ?? null,
    removed: false,
    type: item.type
  }));
}

type ProjectedEconomyItem = ReturnType<typeof projectEconomyItems>[number];

function isProjectedAs(stored: EconomyItem, item: ProjectedEconomyItem) {
  return (Object.keys(item) as (keyof ProjectedEconomyItem)[]).every(
    (key) => stored[key] === item[key]
  );
}

/**
 * Syncs the `EconomyItem` table when the stored projection doesn't match the
 * loaded cs2-lib or `ECONOMY_PROJECTION_VERSION`. Both only change with a
 * deploy, so this runs once per process. Items are never deleted: `EconomyPrice`
 * history references them, so items cs2-lib drops are flagged `removed`.
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
    const state = await ensureState();
    if (
      state.cs2LibVersion === version &&
      state.economyProjectionVersion === ECONOMY_PROJECTION_VERSION
    ) {
      return;
    }
    const items = projectEconomyItems();
    await prisma.$transaction(
      async (tx) => {
        const stored = new Map(
          (await tx.economyItem.findMany()).map((item) => [item.id, item])
        );
        const created: ProjectedEconomyItem[] = [];
        for (const item of items) {
          const storedItem = stored.get(item.id);
          stored.delete(item.id);
          if (storedItem === undefined) {
            created.push(item);
          } else if (!isProjectedAs(storedItem, item)) {
            await tx.economyItem.update({ data: item, where: { id: item.id } });
          }
        }
        for (let index = 0; index < created.length; index += 1_000) {
          await tx.economyItem.createMany({
            data: created.slice(index, index + 1_000)
          });
        }
        // What's left in `stored` is what cs2-lib dropped.
        await tx.economyItem.updateMany({
          data: { removed: true },
          where: {
            id: {
              in: [...stored.values()]
                .filter(({ removed }) => !removed)
                .map(({ id }) => id)
            }
          }
        });
        await tx.economyProjectionState.update({
          data: {
            cs2LibVersion: version,
            economyProjectionVersion: ECONOMY_PROJECTION_VERSION
          },
          where: { id: STATE_ID }
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
