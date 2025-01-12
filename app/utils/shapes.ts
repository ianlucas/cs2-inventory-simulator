/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { z } from "zod";

export const nonNegativeInt = z.number().int().nonnegative().finite().safe();
export const positiveInt = z.number().int().positive().finite().safe();
export const nonNegativeFloat = z.number().nonnegative().finite();

export const baseInventoryItemProps = {
  equipped: z.boolean().optional(),
  equippedCT: z.boolean().optional(),
  equippedT: z.boolean().optional(),
  id: nonNegativeInt.refine((id) => CS2Economy.items.has(id)),
  nameTag: z
    .string()
    .max(20)
    .optional()
    .transform((nameTag) => CS2Economy.trimNametag(nameTag))
    .refine((nameTag) => CS2Economy.safeValidateNametag(nameTag)),
  patches: z.record(nonNegativeInt).optional(),
  seed: positiveInt.optional(),
  statTrak: z.literal(0).optional(),
  stickers: z
    .record(
      z.object({
        id: nonNegativeInt,
        wear: nonNegativeFloat.optional(),
        x: z.number().finite().optional(),
        y: z.number().finite().optional()
      })
    )
    .optional(),
  wear: nonNegativeFloat
    .optional()
    .refine((wear) => wear === undefined || CS2Economy.safeValidateWear(wear))
};

const baseServerInventoryItemProps = {
  ...baseInventoryItemProps,
  statTrak: z
    .number()
    .optional()
    .refine(
      (statTrak) =>
        statTrak === undefined || CS2Economy.safeValidateStatTrak(statTrak)
    )
};

const serverInventoryItemProps = {
  ...baseServerInventoryItemProps,
  containerId: nonNegativeInt.optional(),
  storage: z.record(z.object(baseServerInventoryItemProps)).optional()
};

export const serverInventoryItemShape = z.object(serverInventoryItemProps);

export const serverInventoryShape = z.object({
  items: z.record(serverInventoryItemShape),
  version: nonNegativeInt
});

export const teamShape = z.literal(0).or(z.literal(2)).or(z.literal(3));
