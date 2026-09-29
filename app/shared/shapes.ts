/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { z } from "zod";

export const nonNegativeInt = z.number().int().nonnegative();
export const positiveInt = z.number().int().positive();
export const nonNegativeFloat = z.number().nonnegative();
export const optionalNumber = z.number().optional();

export const baseInventoryItemProps = {
  equipped: z.boolean().optional(),
  equippedCT: z.boolean().optional(),
  equippedT: z.boolean().optional(),
  id: nonNegativeInt,
  nameTag: z
    .string()
    .max(20)
    .optional()
    .transform((nameTag) => CS2Economy.trimNameTag(nameTag))
    .optional(),
  keychains: z
    .record(
      z.string(),
      z.object({
        id: nonNegativeInt,
        seed: positiveInt.optional(),
        x: optionalNumber,
        y: optionalNumber,
        z: optionalNumber
      })
    )
    .optional(),
  patches: z.record(z.string(), nonNegativeInt).optional(),
  seed: positiveInt.optional(),
  statTrak: z.literal(0).optional(),
  stickers: z
    .record(
      z.string(),
      z.object({
        id: nonNegativeInt,
        rotation: optionalNumber,
        wear: optionalNumber,
        schema: z.number().int().min(0).optional(),
        x: optionalNumber,
        y: optionalNumber
      })
    )
    .optional(),
  wear: nonNegativeFloat.optional()
};

export const teamShape = z.literal(0).or(z.literal(2)).or(z.literal(3));

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

export const clientInventoryItemShape = z.object(clientInventoryItemProps);

export const syncInventoryItemShape = z.object(syncInventoryItemProps);

export const clientInventoryShape = z.object({
  items: z.record(z.string(), clientInventoryItemShape),
  version: nonNegativeInt
});

export const syncInventoryShape = z.object({
  items: z.record(z.string(), syncInventoryItemShape),
  version: nonNegativeInt
});

export const itemEditorAttributesShape = z
  .object(clientInventoryItemProps)
  .pick({
    keychains: true,
    nameTag: true,
    patches: true,
    seed: true,
    stickers: true,
    wear: true
  })
  .extend({
    statTrak: z.boolean().optional()
  });

export type SyncInventoryItemShape = z.infer<typeof syncInventoryItemShape>;
export type SyncInventoryShape = z.infer<typeof syncInventoryShape>;
