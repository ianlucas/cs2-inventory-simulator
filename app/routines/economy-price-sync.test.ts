/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const projection: { finish: (current: boolean) => void } = {
    finish: () => {}
  };
  return {
    projection,
    upsert: vi.fn(async () => ({ lastSucceededSourceDate: null })),
    isCurrentAfterRun: vi.fn(
      () => new Promise<boolean>((resolve) => (projection.finish = resolve))
    )
  };
});

vi.mock("~/db.server", () => ({
  prisma: { economyPriceSyncState: { upsert: mocks.upsert } }
}));
vi.mock("~/shared/monitoring", () => ({ logError: vi.fn() }));
vi.mock("./economy-projector", () => ({
  economyProjector: { isCurrentAfterRun: mocks.isCurrentAfterRun }
}));

import { economyPriceSync } from "./economy-price-sync";

it("waits for the economy projection before reading its state, and skips when it isn't current", async () => {
  economyPriceSync.start();
  await vi.waitFor(() => expect(mocks.isCurrentAfterRun).toHaveBeenCalled());
  expect(mocks.upsert).not.toHaveBeenCalled();
  mocks.projection.finish(false);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(mocks.upsert).not.toHaveBeenCalled();
});
