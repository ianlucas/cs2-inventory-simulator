/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_ITEMS, CS2Economy, ensure } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { describe, expect, test } from "vitest";
import {
  getUnboxingPayout,
  getUnboxingPrice,
  getUnboxingWeekStart,
  rankUnboxingLeague
} from "./unboxing-league";

const KILOWATT_CASE_ID = 11422;
const STICKER_CAPSULE_ID = 9134;
const STATTRAK_MASTERMINDS_MUSIC_KIT_BOX_ID = 9401;
const GRID_STEPS = 4_000;

CS2Economy.load({ items: CS2_ITEMS, language: english });

// Every outcome of a container with its chance, splitting each wear range into
// `GRID_STEPS` equally likely floats.
function listOutcomes(containerId: number) {
  const container = CS2Economy.getById(containerId);
  return container.listUnlockableItems().flatMap((unlockable) =>
    [true, false].flatMap((statTrak) => {
      const chance =
        unlockable.chance *
        (statTrak ? unlockable.statTrakChance : 1 - unlockable.statTrakChance);
      if (chance === 0) {
        return [];
      }
      const { wearMax, wearMin } = unlockable;
      const wears =
        wearMin !== undefined && wearMax !== undefined
          ? Array.from(
              { length: GRID_STEPS },
              (_, step) =>
                wearMin + ((step + 0.5) / GRID_STEPS) * (wearMax - wearMin)
            )
          : [undefined];
      return wears.map((wear) => ({
        chance: chance / wears.length,
        payout: getUnboxingPayout(container, {
          id: unlockable.id,
          statTrak,
          wear
        })
      }));
    })
  );
}

describe("getUnboxingPayout", () => {
  const container = CS2Economy.getById(KILOWATT_CASE_ID);
  const unlockables = container.listUnlockableItems();
  const specials = unlockables.filter(({ rarity }) => rarity === "special");
  const knife = ensure(specials.find(({ wearMin }) => wearMin !== undefined));
  const vanillaKnife = ensure(
    specials.find(({ wearMin }) => wearMin === undefined)
  );
  const covert = ensure(unlockables.find(({ rarity }) => rarity === "ancient"));
  const knifeWearMin = ensure(knife.wearMin);
  const knifeWearMax = ensure(knife.wearMax);
  const knifeWearRange = knifeWearMax - knifeWearMin;
  const specialChance = specials.reduce((acc, { chance }) => acc + chance, 0);

  test("pays 1 for the worst possible drop", () => {
    const worst = ensure(unlockables[0]);
    expect(
      getUnboxingPayout(container, {
        id: worst.id,
        statTrak: false,
        wear: worst.wearMax
      })
    ).toBeCloseTo(1, 12);
  });

  test("pays 1 / the chance of a special for the worst special", () => {
    expect(
      getUnboxingPayout(container, {
        id: vanillaKnife.id,
        statTrak: false,
        wear: undefined
      })
    ).toBeCloseTo(1 / specialChance, 6);
  });

  test("ranks rarity first, then StatTrak, then lower float", () => {
    const payout = (id: number, statTrak: boolean, wear?: number) =>
      getUnboxingPayout(container, { id, statTrak, wear });
    expect(payout(knife.id, false, knife.wearMax)).toBeGreaterThan(
      payout(covert.id, true, covert.wearMin)
    );
    expect(payout(knife.id, true, knife.wearMax)).toBeGreaterThan(
      payout(knife.id, false, knife.wearMin)
    );
    expect(
      payout(knife.id, false, knifeWearMin + knifeWearRange * 0.3)
    ).toBeGreaterThan(
      payout(knife.id, false, knifeWearMin + knifeWearRange * 0.6)
    );
    expect(payout(knife.id, false, knife.wearMax)).toBe(
      payout(vanillaKnife.id, false)
    );
    expect(
      payout(knife.id, false, knifeWearMax - knifeWearRange * 0.01)
    ).toBeGreaterThan(payout(vanillaKnife.id, false));
  });

  test("pays the same for every float in the best 1% of the range", () => {
    const best = getUnboxingPayout(container, {
      id: knife.id,
      statTrak: true,
      wear: knifeWearMin
    });
    expect(
      getUnboxingPayout(container, {
        id: knife.id,
        statTrak: true,
        wear: knifeWearMin + knifeWearRange * 0.005
      })
    ).toBe(best);
    expect(
      getUnboxingPayout(container, {
        id: knife.id,
        statTrak: true,
        wear: knifeWearMin + knifeWearRange * 0.02
      })
    ).toBeLessThan(best);
  });

  test("gives every container the same 1 / N chance of paying N or more", () => {
    const outcomes = listOutcomes(KILOWATT_CASE_ID);
    for (const threshold of [50, 500]) {
      const chance = outcomes
        .filter(({ payout }) => payout >= threshold)
        .reduce((acc, outcome) => acc + outcome.chance, 0);
      expect(chance * threshold).toBeCloseTo(1, 2);
    }
  });
});

describe("getUnboxingPrice", () => {
  test.each([KILOWATT_CASE_ID, STICKER_CAPSULE_ID])(
    "is the average payout of container %i",
    (containerId) => {
      const average = listOutcomes(containerId).reduce(
        (acc, { chance, payout }) => acc + chance * payout,
        0
      );
      const price = getUnboxingPrice(CS2Economy.getById(containerId));
      expect(Math.abs(average - price) / price).toBeLessThan(1e-3);
    }
  );

  test("is 1 for a container whose drops are all equally good", () => {
    const container = CS2Economy.getById(STATTRAK_MASTERMINDS_MUSIC_KIT_BOX_ID);
    expect(getUnboxingPrice(container)).toBeCloseTo(1, 12);
    for (const { id } of container.listUnlockableItems()) {
      expect(
        getUnboxingPayout(container, { id, statTrak: true, wear: undefined })
      ).toBeCloseTo(1, 12);
    }
  });
});

test("getUnboxingWeekStart returns the week's Monday at 00:00 UTC", () => {
  const monday = new Date("2026-10-19T00:00:00.000Z");
  expect(getUnboxingWeekStart(monday)).toEqual(monday);
  expect(getUnboxingWeekStart(new Date("2026-10-21T15:30:00.000Z"))).toEqual(
    monday
  );
  expect(getUnboxingWeekStart(new Date("2026-10-25T23:59:59.999Z"))).toEqual(
    monday
  );
  expect(getUnboxingWeekStart(new Date("2026-10-26T00:00:00.000Z"))).toEqual(
    new Date("2026-10-26T00:00:00.000Z")
  );
});

test("rankUnboxingLeague ranks by profit, then by who got there first", () => {
  const at = (minutes: number) => new Date(Date.UTC(2026, 9, 19, 0, minutes));
  expect(
    rankUnboxingLeague(
      [
        { lastUnlockedAt: at(5), profit: 10, userId: "c" },
        { lastUnlockedAt: at(1), profit: 500, userId: "a" },
        { lastUnlockedAt: at(3), profit: 10, userId: "b" },
        { lastUnlockedAt: at(3), profit: 10, userId: "a2" }
      ],
      new Map([["b", 1]])
    ).map(({ previousRank, rank, userId }) => ({ previousRank, rank, userId }))
  ).toEqual([
    { previousRank: null, rank: 1, userId: "a" },
    { previousRank: null, rank: 2, userId: "a2" },
    { previousRank: 1, rank: 3, userId: "b" },
    { previousRank: null, rank: 4, userId: "c" }
  ]);
});
