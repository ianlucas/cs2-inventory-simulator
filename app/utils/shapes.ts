/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy, CS_NONE } from "@ianlucas/cs2-lib";
import { z } from "zod";
import { size } from "./number";

export const nonNegativeInt = z.number().int().nonnegative().finite().safe();
export const positiveInt = z.number().int().positive().finite().safe();
export const nonNegativeFloat = z.number().nonnegative().finite();

export const baseInventoryItemProps = {
  equipped: z.boolean().optional(),
  equippedCT: z.boolean().optional(),
  equippedT: z.boolean().optional(),
  id: nonNegativeInt,
  nametag: z
    .string()
    .max(20)
    .optional()
    .transform((nametag) => CS_Economy.trimNametag(nametag))
    .refine((nametag) => CS_Economy.safeValidateNametag(nametag)),
  seed: positiveInt
    .optional()
    .refine((seed) => CS_Economy.safeValidateSeed(seed)),
  stattrak: z.literal(0).optional(),
  stickers: z
    .array(nonNegativeInt)
    .optional()
    .transform((stickers) =>
      size(stickers?.filter((sticker) => sticker !== CS_NONE)) > 0
        ? stickers
        : undefined
    ),
  stickerswear: z
    .array(nonNegativeFloat)
    .optional()
    .transform((stickerswear) =>
      size(stickerswear?.filter((wear) => wear !== CS_NONE)) > 0
        ? stickerswear
        : undefined
    ),
  wear: nonNegativeFloat
    .optional()
    .refine((wear) => wear === undefined || CS_Economy.safeValidateWear(wear))
};

const baseServerInventoryItemProps = {
  ...baseInventoryItemProps,
  stattrak: z
    .number()
    .optional()
    .refine(
      (stattrak) =>
        stattrak === undefined || CS_Economy.safeValidateStatTrak(stattrak)
    ),
  uid: nonNegativeInt
};

const serverInventoryItemProps = {
  ...baseServerInventoryItemProps,
  storage: z.array(z.object(baseServerInventoryItemProps)).optional()
};

export const serverInventoryItemShape = z.object(serverInventoryItemProps);

export const serverInventoryShape = z.array(serverInventoryItemShape);

export const teamShape = z.literal(0).or(z.literal(2)).or(z.literal(3));
