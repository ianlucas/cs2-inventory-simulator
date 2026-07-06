/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { z } from "zod";
import {
  validateKeychainOffset,
  validateKeychainSeed,
  validateStickerOffset,
  validateStickerRotation,
  validateStickerWear
} from "./economy";

export const nonNegativeInt = z.number().int().nonnegative().finite().safe();
export const positiveInt = z.number().int().positive().finite().safe();
export const nonNegativeFloat = z.number().nonnegative().finite();

// A sticker placement's offset (x/y), rotation, and wear — each optional and
// self-validating against the economy rules. Shared by the stored-inventory shape
// below and the sync action shape (`~/routes/api.action.sync`) so the two never drift
// on what a valid placement is. Offsets and rotation are signed (the sticker moves
// either way and rotates to negative angles), so the base is a plain finite number —
// NOT `positiveInt`, which would wrongly reject negatives, zero, and fractions.
export const optionalStickerOffset = z
  .number()
  .finite()
  .optional()
  .refine(
    (value) =>
      value === undefined || validateStickerOffset(value, undefined, undefined)
  );
export const optionalStickerRotation = z
  .number()
  .finite()
  .optional()
  .refine((value) => value === undefined || validateStickerRotation(value));
export const optionalStickerWear = z
  .number()
  .finite()
  .optional()
  .refine((value) => value === undefined || validateStickerWear(value));

export const baseInventoryItemProps = {
  equipped: z.boolean().optional(),
  equippedCT: z.boolean().optional(),
  equippedT: z.boolean().optional(),
  id: nonNegativeInt.refine((id) => CS2Economy.items.has(id)),
  nameTag: z
    .string()
    .max(20)
    .optional()
    .transform((nameTag) => CS2Economy.trimNameTag(nameTag))
    .refine((nameTag) => CS2Economy.safeValidateNameTag(nameTag))
    .optional(),
  keychains: z
    .record(
      z.string(),
      z.object({
        id: nonNegativeInt,
        seed: positiveInt
          .optional()
          .refine((seed) => seed === undefined || validateKeychainSeed(seed)),
        x: z
          .number()
          .optional()
          .refine((x) => x === undefined || validateKeychainOffset(x)),
        y: z
          .number()
          .optional()
          .refine((y) => y === undefined || validateKeychainOffset(y)),
        z: z
          .number()
          .optional()
          .refine((z) => z === undefined || validateKeychainOffset(z))
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
        rotation: optionalStickerRotation,
        wear: optionalStickerWear,
        schema: z.number().int().min(0).optional(),
        x: optionalStickerOffset,
        y: optionalStickerOffset
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
