/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy } from "@ianlucas/cslib";
import { z } from "zod";
import { baseInventoryItemProps, nonNegativeInt } from "./shapes";

const clientInventoryItemProps = {
  ...baseInventoryItemProps
};

const syncInventoryItemProps = {
  ...clientInventoryItemProps,
  storage: z
    .array(
      z.object({
        ...clientInventoryItemProps,
        uid: nonNegativeInt
      })
    )
    .optional(),
  uid: nonNegativeInt
};

function legit({
  id,
  nametag,
  stickers
}: {
  id: number;
  nametag?: string;
  stickers?: number[];
}) {
  // Free items can be stored if they have a nametag or stickers
  if (
    CS_Economy.getById(id).free &&
    nametag === undefined &&
    stickers === undefined
  ) {
    return false;
  }
  return true;
}

function refine(
  inventoryItem: Omit<
    z.infer<Zod.ZodObject<typeof syncInventoryItemProps>>,
    "uid"
  >
) {
  if (!legit(inventoryItem)) {
    return false;
  }
  if (inventoryItem.storage !== undefined) {
    for (const item of inventoryItem.storage) {
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

export const clientInventoryShape = z.array(clientInventoryItemShape);
export const syncInventoryShape = z.array(syncInventoryItemShape);

export type SyncInventoryItemShape = z.infer<typeof syncInventoryItemShape>;
export type SyncInventoryShape = z.infer<typeof syncInventoryShape>;
