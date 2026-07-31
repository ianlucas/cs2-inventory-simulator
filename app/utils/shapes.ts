/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { z } from "zod";

export const nonNegativeInt = z.number().int().nonnegative();
export const positiveInt = z.number().int().positive();
export const nonNegativeFloat = z.number().nonnegative();
export const optionalFiniteNumber = z.number().optional();

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
        x: optionalFiniteNumber,
        y: optionalFiniteNumber,
        z: optionalFiniteNumber
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
        rotation: optionalFiniteNumber,
        wear: optionalFiniteNumber,
        schema: z.number().int().min(0).optional(),
        x: optionalFiniteNumber,
        y: optionalFiniteNumber
      })
    )
    .optional(),
  wear: nonNegativeFloat.optional()
};

export const teamShape = z.literal(0).or(z.literal(2)).or(z.literal(3));
