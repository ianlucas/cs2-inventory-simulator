/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { z } from "zod";
import { baseInventoryItemProps, nonNegativeInt } from "./shapes";

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
