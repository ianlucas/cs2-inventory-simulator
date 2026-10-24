/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_MAX_STICKERS } from "@ianlucas/cs2-lib";
import { beforeEach, expect, test, vi } from "vitest";

const { ruleFindMany, userRuleFindMany, userGroupFindFirst } = vi.hoisted(
  () => ({
    ruleFindMany: vi.fn(),
    userRuleFindMany: vi.fn(),
    userGroupFindFirst: vi.fn()
  })
);

vi.mock("~/db.server", () => ({
  prisma: {
    rule: { findMany: ruleFindMany },
    userRule: { findMany: userRuleFindMany },
    userGroup: { findFirst: userGroupFindFirst }
  }
}));
vi.mock("~/env.server", () => ({
  STEAM_API_KEY: undefined,
  STEAM_CALLBACK_URL: undefined,
  VIEWER_KEY: undefined
}));

import {
  appName,
  craftAllowNametag,
  craftHideId,
  craftHideType,
  inventoryItemMaxStickers,
  inventoryMaxItems,
  inventoryMaxLoadouts,
  Rule
} from "./rule.server";

const userId = "76561197960287930";

type Row = { name: string; value: string };

function mockRows({
  rules = [],
  userOverrides = [],
  groupOverrides
}: {
  rules?: Row[];
  userOverrides?: Row[];
  groupOverrides?: Row[];
}) {
  ruleFindMany.mockResolvedValue(rules);
  userRuleFindMany.mockResolvedValue(userOverrides);
  userGroupFindFirst.mockResolvedValue(
    groupOverrides !== undefined
      ? { group: { overrides: groupOverrides } }
      : null
  );
}

beforeEach(() => {
  ruleFindMany.mockReset();
  userRuleFindMany.mockReset();
  userGroupFindFirst.mockReset();
});

test("Rule.getMany reads all rules in one query when signed out", async () => {
  mockRows({
    rules: [
      { name: "appName", value: "Simulator" },
      { name: "inventoryMaxItems", value: "128" }
    ]
  });
  const rules = await Rule.getMany({ appName, inventoryMaxItems });
  expect(rules).toEqual({ appName: "Simulator", inventoryMaxItems: 128 });
  expect(ruleFindMany).toHaveBeenCalledOnce();
  expect(ruleFindMany).toHaveBeenCalledWith({
    select: { name: true, value: true },
    where: { name: { in: ["appName", "inventoryMaxItems"] } }
  });
  expect(userRuleFindMany).not.toHaveBeenCalled();
  expect(userGroupFindFirst).not.toHaveBeenCalled();
});

test("Rule.getMany starts all three queries in parallel when signed in", async () => {
  mockRows({});
  const pending = Rule.getMany({ appName, inventoryMaxItems }, userId);
  expect(ruleFindMany).toHaveBeenCalledOnce();
  expect(userRuleFindMany).toHaveBeenCalledOnce();
  expect(userGroupFindFirst).toHaveBeenCalledOnce();
  await pending;
});

test("Rule.getMany reads only the user's own overrides", async () => {
  mockRows({});
  await Rule.getMany({ appName, inventoryMaxItems }, userId);
  expect(userRuleFindMany).toHaveBeenCalledWith({
    select: { name: true, value: true },
    where: { name: { in: ["appName", "inventoryMaxItems"] }, userId }
  });
});

test("Rule.getMany reads overrides from the user's top group by priority, then group id", async () => {
  mockRows({});
  await Rule.getMany({ appName, inventoryMaxItems }, userId);
  expect(userGroupFindFirst).toHaveBeenCalledWith({
    select: {
      group: {
        select: {
          overrides: {
            select: { name: true, value: true },
            where: { name: { in: ["appName", "inventoryMaxItems"] } }
          }
        }
      }
    },
    where: { userId },
    orderBy: [{ group: { priority: "desc" } }, { groupId: "asc" }]
  });
});

test("Rule.getMany prefers user override, then group override, then rule, then default", async () => {
  mockRows({
    rules: [
      { name: "inventoryMaxItems", value: "100" },
      { name: "inventoryMaxLoadouts", value: "20" },
      { name: "appName", value: "Global" }
    ],
    groupOverrides: [
      { name: "inventoryMaxItems", value: "200" },
      { name: "inventoryMaxLoadouts", value: "30" }
    ],
    userOverrides: [{ name: "inventoryMaxItems", value: "300" }]
  });
  const rules = await Rule.getMany(
    { inventoryMaxItems, inventoryMaxLoadouts, appName, craftAllowNametag },
    userId
  );
  expect(rules).toEqual({
    inventoryMaxItems: 300,
    inventoryMaxLoadouts: 30,
    appName: "Global",
    craftAllowNametag: craftAllowNametag.defaultValue
  });
});

test("Rule.getMany falls back to the rule when the top group has no override", async () => {
  mockRows({
    rules: [{ name: "inventoryMaxItems", value: "100" }],
    groupOverrides: []
  });
  const rules = await Rule.getMany({ inventoryMaxItems }, userId);
  expect(rules.inventoryMaxItems).toBe(100);
});

test("Rule.getMany parses stored values by type", async () => {
  mockRows({
    rules: [
      { name: "craftAllowNametag", value: "false" },
      { name: "craftHideType", value: "weapon; ; agent" },
      { name: "craftHideId", value: "1;2;3" }
    ]
  });
  const rules = await Rule.getMany({
    craftAllowNametag,
    craftHideType,
    craftHideId
  });
  expect(rules).toEqual({
    craftAllowNametag: false,
    craftHideType: ["weapon", "agent"],
    craftHideId: [1, 2, 3]
  });
});

test("Rule.getMany applies transform to default and stored values", async () => {
  mockRows({});
  expect(
    (await Rule.getMany({ inventoryItemMaxStickers })).inventoryItemMaxStickers
  ).toBe(CS2_MAX_STICKERS);
  mockRows({
    userOverrides: [{ name: "inventoryItemMaxStickers", value: "2" }]
  });
  expect(
    (await Rule.getMany({ inventoryItemMaxStickers }, userId))
      .inventoryItemMaxStickers
  ).toBe(2);
});

test("rule.get and rule.for resolve the same way as Rule.getMany", async () => {
  mockRows({
    rules: [{ name: "appName", value: "Global" }],
    groupOverrides: [{ name: "appName", value: "Group" }]
  });
  expect(await appName.get()).toBe("Global");
  expect(userGroupFindFirst).not.toHaveBeenCalled();
  expect(await appName.for(userId).get()).toBe("Group");
});
