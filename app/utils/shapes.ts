import { CS_MAX_FLOAT, CS_MAX_SEED, CS_MIN_FLOAT, CS_MIN_SEED, CS_nametagRE } from "cslib";
import { z } from "zod";

export const inventoryItemShape = z.object({
  equipped: z.boolean().optional(),
  equippedCT: z.boolean().optional(),
  equippedT: z.boolean().optional(),
  float: z.number().optional().refine(float =>
    float === undefined || (
      String(float).length <= String(CS_MAX_FLOAT).length
      && float >= CS_MIN_FLOAT && float <= CS_MAX_FLOAT
    )
  ),
  id: z.number(),
  nametag: z.string().optional()
    .transform(nametag => nametag !== undefined ? nametag.trim() : nametag)
    .refine(nametag => nametag === undefined || CS_nametagRE.exec(nametag)),
  seed: z.number().optional().refine(seed =>
    seed === undefined || (
      !String(seed).includes(".")
      && seed >= CS_MIN_SEED && seed <= CS_MAX_SEED
    )
  ),
  stattrak: z.boolean().optional(),
  stickers: z.array(z.number().or(z.null())).optional(),
  stickersfloat: z.array(z.number().or(z.null())).optional()
});

export const inventoryShape = z.array(inventoryItemShape);

export const csTeamShape = z.literal(2).or(z.literal(3));
