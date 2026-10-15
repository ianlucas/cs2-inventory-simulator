/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, it } from "vitest";
import { z } from "zod";
import { CS2ItemExterior } from "~/generated/prisma/enums";
import { nonNegativeFloat, nonNegativeInt } from "~/shared/shapes";
import json from "./economy-prices-2026-10-14.json?raw";

const rowShape = z.strictObject({
  economyItemId: nonNegativeInt,
  exterior: z.enum(CS2ItemExterior).nullable(),
  price: nonNegativeFloat,
  approximate: z.boolean(),
  marketHashName: z.string().min(1),
  statTrak: z.boolean()
});

it("holds one EconomyPrice row per item listing", () => {
  const rows = z.array(rowShape).parse(JSON.parse(json));
  expect(rows.length).toBeGreaterThan(0);
  expect(
    new Set(
      rows.map(
        ({ economyItemId, exterior, statTrak }) =>
          `${economyItemId}:${exterior}:${statTrak}`
      )
    ).size
  ).toBe(rows.length);
});
