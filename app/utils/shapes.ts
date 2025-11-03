/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { z } from "zod";
import {
  validateStickerOffset,
  validateStickerRotation,
  validateStickerWear
} from "./economy";

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
    .refine((nameTag) => CS2Economy.safeValidateNametag(nameTag))
    .optional(),
  patches: z.record(z.string(), nonNegativeInt).optional(),
  seed: positiveInt.optional(),
  statTrak: z.literal(0).optional(),
  stickers: z
    .record(
      z.string(),
      z.object({
        id: nonNegativeInt,
        rotation: positiveInt
          .optional()
          .refine(
            (rotation) =>
              rotation === undefined || validateStickerRotation(rotation)
          ),
        wear: nonNegativeFloat
          .optional()
          .refine((wear) => wear === undefined || validateStickerWear(wear)),
        x: z
          .number()
          .optional()
          .refine((x) => x === undefined || validateStickerOffset(x)),
        y: z
          .number()
          .optional()
          .refine((y) => y === undefined || validateStickerOffset(y))
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
  storage: z
    .record(z.string(), z.object(baseServerInventoryItemProps))
    .optional()
};

export const serverInventoryItemShape = z.object(serverInventoryItemProps);

export const serverInventoryShape = z.object({
  items: z.record(z.string(), serverInventoryItemShape),
  version: nonNegativeInt
});

export const teamShape = z.literal(0).or(z.literal(2)).or(z.literal(3));
