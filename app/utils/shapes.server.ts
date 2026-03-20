/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2BaseInventoryItem, CS2Economy } from "@ianlucas/cs2-lib";
import { z, ZodObject } from "zod";
import { baseStickerSlabId } from "./economy";
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

function allowed({
  id,
  nameTag,
  stickers,
  keychains
}: Pick<CS2BaseInventoryItem, "id" | "nameTag" | "stickers" | "keychains">) {
  // Free items can be stored if they have a nametag or stickers or keychains
  if (
    CS2Economy.getById(id).free &&
    nameTag === undefined &&
    stickers === undefined &&
    keychains === undefined
  ) {
    return false;
  }
  if (keychains !== undefined) {
    for (const { id } of Object.values(keychains)) {
      if (id === baseStickerSlabId) {
        return false;
      }
    }
  }
  return true;
}

function refine(
  inventoryItem: z.infer<ZodObject<typeof syncInventoryItemProps>>
) {
  if (!allowed(inventoryItem)) {
    return false;
  }
  if (inventoryItem.storage !== undefined) {
    for (const item of Object.values(inventoryItem.storage)) {
      if (!allowed(item)) {
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
