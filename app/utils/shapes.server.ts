/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2BaseInventoryItem, CS2Economy } from "@ianlucas/cs2-lib";
import { z, ZodObject } from "zod";
import { baseInventoryItemProps, nonNegativeInt } from "./shapes";

const clientInventoryItemProps = {
  ...baseInventoryItemProps
};

const syncInventoryItemProps = {
  ...clientInventoryItemProps,
  storage: z
    .record(
      z.string(),
      z.object({
        ...clientInventoryItemProps
      })
    )
    .optional()
};

function legit({
  id,
  nameTag,
  stickers
}: {
  id: number;
  nameTag?: string;
  stickers?: CS2BaseInventoryItem["stickers"];
}) {
  // Free items can be stored if they have a nametag or stickers
  if (
    CS2Economy.getById(id).free &&
    nameTag === undefined &&
    stickers === undefined
  ) {
    return false;
  }
  return true;
}

function refine(
  inventoryItem: z.infer<ZodObject<typeof syncInventoryItemProps>>
) {
  if (!legit(inventoryItem)) {
    return false;
  }
  if (inventoryItem.storage !== undefined) {
    for (const item of Object.values(inventoryItem.storage)) {
      if (!legit(item)) {
        return false;
      }
    }
  }
  return true;
}

export const clientInventoryItemShape = z
  .object(clientInventoryItemProps)
  .refine(refine);

export const syncInventoryItemShape = z
  .object(syncInventoryItemProps)
  .refine(refine);

export const clientInventoryShape = z.object({
  items: z.record(z.string(), clientInventoryItemShape),
  version: nonNegativeInt
});

export const syncInventoryShape = z.object({
  items: z.record(z.string(), syncInventoryItemShape),
  version: nonNegativeInt
});

export type SyncInventoryItemShape = z.infer<typeof syncInventoryItemShape>;
export type SyncInventoryShape = z.infer<typeof syncInventoryShape>;
