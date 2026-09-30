/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, it } from "vitest";
import { z } from "zod";
import { CS2ItemExterior } from "~/generated/prisma/enums";
import { nonNegativeFloat, nonNegativeInt } from "~/shared/shapes";
import json from "./economy-prices-2026-08-02.json?raw";

const priceShape = nonNegativeFloat.nullable();

const rowShape = z.strictObject({
  economyItemId: nonNegativeInt,
  exterior: z.enum(CS2ItemExterior).nullable(),
  avgPrice24h: priceShape,
  avgPrice7d: priceShape,
  avgPrice30d: priceShape,
  avgPrice90d: priceShape,
  marketHashName: z.string().min(1),
  souvenir: z.boolean(),
  statTrak: z.boolean()
});

it("holds one EconomyPrice row per market hash name", () => {
  const rows = z.array(rowShape).parse(JSON.parse(json));
  expect(rows.length).toBeGreaterThan(0);
  expect(new Set(rows.map(({ marketHashName }) => marketHashName)).size).toBe(
    rows.length
  );
});
