/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_safeValidateNametag,
  CS_safeValidateSeed,
  CS_safeValidateStatTrak,
  CS_safeValidateWear
} from "@ianlucas/cslib";
import { z } from "zod";

const inventoryItemProps = {
  equipped: z.boolean().optional(),
  equippedCT: z.boolean().optional(),
  equippedT: z.boolean().optional(),
  id: z.number().refine((id) => !CS_Economy.getById(id).free),
  nametag: z
    .string()
    .optional()
    .transform((nametag) => (nametag !== undefined ? nametag.trim() : nametag))
    .refine(
      (nametag) => nametag === undefined || CS_safeValidateNametag(nametag)
    ),
  seed: z
    .number()
    .optional()
    .refine((seed) => seed === undefined || CS_safeValidateSeed(seed)),
  stattrak: z.literal(0).optional(),
  stickers: z.array(z.number().or(z.null())).optional(),
  stickerswear: z
    .array(z.number().or(z.null()))
    .optional()
    .transform((stickerswear) =>
      stickerswear === undefined
        ? undefined
        : stickerswear.filter((wear) => wear !== null && wear !== 0).length > 0
          ? stickerswear
          : undefined
    ),
  wear: z
    .number()
    .optional()
    .refine((wear) => wear === undefined || CS_safeValidateWear(wear))
};

export const externalInventoryItemShape = z.object(inventoryItemProps);
export const externalInventoryShape = z.array(externalInventoryItemShape);
export const internalInventoryShape = z.array(
  z.object({
    ...inventoryItemProps,
    id: z.number(),
    stattrak: z
      .number()
      .optional()
      .refine(
        (stattrak) =>
          stattrak === undefined || CS_safeValidateStatTrak(stattrak)
      )
  })
);

export const teamShape = z.literal(0).or(z.literal(2)).or(z.literal(3));

export type ExternalInventoryItemShape = z.infer<
  typeof externalInventoryItemShape
>;
export type ExternalInventoryShape = z.infer<typeof externalInventoryShape>;
