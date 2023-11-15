/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_safeValidateNametag, CS_safeValidateSeed, CS_safeValidateWear } from "@ianlucas/cslib";
import { z } from "zod";

export const inventoryItemShape = z.object({
  equipped: z.boolean().optional(),
  equippedCT: z.boolean().optional(),
  equippedT: z.boolean().optional(),
  wear: z.number().optional().refine(wear =>
    wear === undefined || CS_safeValidateWear(wear)
  ),
  id: z.number(),
  nametag: z.string().optional()
    .transform(nametag => nametag !== undefined ? nametag.trim() : nametag)
    .refine(nametag =>
      nametag === undefined || CS_safeValidateNametag(nametag)
    ),
  seed: z.number().optional().refine(seed =>
    seed === undefined || CS_safeValidateSeed(seed)
  ),
  stattrak: z.literal(0).optional(),
  stickers: z.array(z.number().or(z.null())).optional(),
  stickerswear: z.array(z.number().or(z.null())).optional()
});

export const inventoryShape = z.array(inventoryItemShape);

export const csTeamShape = z.literal(2).or(z.literal(3));
