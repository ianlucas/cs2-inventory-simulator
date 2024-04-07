/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { z } from "zod";
import { prisma } from "~/db.server";
import { STEAM_API_KEY, STEAM_CALLBACK_URL } from "~/env.server";
import { assert, fail } from "~/utils/misc";

const booleanRulesNames = ["InventoryItemAllowEdit"] as const;
const numberRulesNames = [
  "InventoryMaxItems",
  "InventoryStorageUnitMaxItems"
] as const;
const numberArrayRulesNames = ["CraftHideId"] as const;
const stringRulesNames = ["SteamApiKey", "SteamCallbackUrl"] as const;
const stringArrayRulesName = [
  "CraftHideCategory",
  "CraftHideType",
  "CraftHideModel"
] as const;

export type BooleanRuleNames = (typeof booleanRulesNames)[number];
export type NumberRuleNames = (typeof numberRulesNames)[number];
export type NumberArrayRuleNames = (typeof numberArrayRulesNames)[number];
export type StringRuleNames = (typeof stringRulesNames)[number];
export type StringArrayRuleNames = (typeof stringArrayRulesName)[number];
export type RuleNames =
  | BooleanRuleNames
  | NumberRuleNames
  | NumberArrayRuleNames
  | StringRuleNames
  | StringArrayRuleNames;
export type RuleTypes =
  | "string"
  | "boolean"
  | "number"
  | "string-array"
  | "number-array";

export async function getUserRuleOverwrite(userId: string, name: string) {
  return (
    await prisma.userRule.findUnique({
      select: { value: true },
      where: { name_userId: { userId, name } }
    })
  )?.value;
}

export async function getUserGroupRuleOverwrite(userId: string, name: string) {
  return (
    await prisma.userGroup.findFirst({
      select: {
        group: {
          select: {
            overwrites: {
              select: { value: true },
              where: { name }
            }
          }
        }
      },
      where: { userId },
      orderBy: {
        group: {
          priority: "desc"
        }
      }
    })
  )?.group?.overwrites?.[0]?.value;
}

export function getRule(
  name: BooleanRuleNames,
  userId?: string
): Promise<boolean>;
export function getRule(
  name: StringRuleNames,
  userId?: string
): Promise<string>;
export function getRule(
  name: NumberRuleNames,
  userId?: string
): Promise<number>;
export function getRule(
  name: StringArrayRuleNames,
  userId?: string
): Promise<string[]>;
export function getRule(
  name: NumberArrayRuleNames,
  userId?: string
): Promise<number[]>;
export function getRule(
  name: RuleNames,
  userId?: string
): Promise<boolean | string | number | string[] | number[]>;
export async function getRule(name: RuleNames, userId?: string) {
  let value: string | undefined = undefined;
  if (userId !== undefined) {
    value =
      (await getUserRuleOverwrite(userId, name)) ??
      (await getUserGroupRuleOverwrite(userId, name));
  }
  if (value === undefined) {
    value = (
      await prisma.rule.findUniqueOrThrow({
        select: { value: true },
        where: { name }
      })
    ).value;
  }
  if (booleanRulesNames.includes(name as BooleanRuleNames)) {
    return value === "true";
  }
  if (numberRulesNames.includes(name as NumberRuleNames)) {
    return Number(value);
  }
  if (stringRulesNames.includes(name as StringRuleNames)) {
    return value;
  }
  if (stringArrayRulesName.includes(name as StringArrayRuleNames)) {
    return value
      .split(";")
      .map((value) => value.trim())
      .filter((value) => value !== "");
  }
  if (numberArrayRulesNames.includes(name as NumberArrayRuleNames)) {
    return value
      .split(";")
      .map((value) => value.trim())
      .filter((value) => value !== "")
      .map(Number);
  }
  fail("Rule not found or has invalid type.");
}

type RuleTypeMap = {
  [name in RuleNames]: name extends BooleanRuleNames
    ? boolean
    : name extends StringRuleNames
      ? string
      : name extends NumberRuleNames
        ? number
        : name extends StringArrayRuleNames
          ? string[]
          : name extends NumberArrayRuleNames
            ? number[]
            : never;
};

type LowercaseKeys<T extends Record<string, any>> = {
  [K in keyof T as `${Uncapitalize<string & K>}`]: T[K];
};

export async function getRules<Names extends RuleNames>(
  names: Names[],
  userId?: string
): Promise<LowercaseKeys<{ [name in Names]: RuleTypeMap[name] }>> {
  return Object.fromEntries(
    await Promise.all(
      names.map(async (name) => [
        name.charAt(0).toLowerCase() + name.slice(1),
        await getRule(name, userId)
      ])
    )
  ) as LowercaseKeys<{ [name in Names]: RuleTypeMap[name] }>;
}

export async function expectRule(
  name: BooleanRuleNames,
  toBe: boolean,
  forUser?: string
) {
  assert(
    (await getRule(name, forUser)) === toBe,
    `Rule ${name} is not ${toBe}`
  );
}

export async function expectRuleNotContain(
  name: StringArrayRuleNames,
  value: string,
  forUser?: string
): Promise<void>;
export async function expectRuleNotContain(
  name: NumberArrayRuleNames,
  value: number,
  forUser?: string
): Promise<void>;
export async function expectRuleNotContain(
  name: StringArrayRuleNames | NumberArrayRuleNames,
  value: string | number,
  forUser?: string
): Promise<void> {
  if (typeof value === "string") {
    assert(
      !(await getRule(name as StringArrayRuleNames, forUser)).includes(value),
      `Rule ${name} contains ${value}`
    );
  }
  if (typeof value === "number") {
    assert(
      !(await getRule(name as NumberArrayRuleNames, forUser)).includes(value),
      `Rule ${name} contains ${value}`
    );
  }
}

export async function setRule({
  type,
  name,
  input
}: {
  type: RuleTypes;
  name: RuleNames;
  input: unknown;
}) {
  let value = "";
  switch (type) {
    case "string":
      assert(typeof input === "string", "invalid string");
      value = input;
      break;
    case "boolean":
      assert(typeof input === "boolean", "invalid boolean");
      value = String(input);
      break;
    case "number":
      assert(typeof input === "number", "invalid number");
      value = String(input);
      break;
    case "string-array":
      const transform = z.array(z.string()).safeParse(input);
      assert(transform.success, "invalid string array");
      value = transform.data.join(";");
      break;
    case "number-array":
      const transform2 = z.array(z.number()).safeParse(input);
      assert(transform2.success, "invalid number array");
      value = transform2.data.join(";");
      break;
  }
  const data = {
    name,
    type,
    value
  };
  await prisma.rule.upsert({
    update: data,
    create: data,
    where: { name }
  });
}

export async function addRule(data: {
  name: RuleNames;
  type: RuleTypes;
  input: unknown;
}) {
  if ((await prisma.rule.count({ where: { name: data.name } })) > 0) {
    return;
  }
  return await setRule(data);
}

export async function setupRules() {
  await addRule({
    name: "InventoryMaxItems",
    type: "number",
    input: 256
  });
  await addRule({
    name: "InventoryStorageUnitMaxItems",
    type: "number",
    input: 32
  });
  await addRule({
    name: "SteamApiKey",
    type: "string",
    input: STEAM_API_KEY ?? "YOUR_STEAM_API_KEY_GOES_HERE"
  });
  await addRule({
    name: "SteamCallbackUrl",
    type: "string",
    input: STEAM_CALLBACK_URL ?? "http://localhost/sign-in/steam/callback"
  });
  await addRule({
    name: "InventoryItemAllowEdit",
    type: "boolean",
    input: false
  });
  await addRule({
    name: "CraftHideCategory",
    type: "string-array",
    input: []
  });
  await addRule({
    name: "CraftHideType",
    type: "string-array",
    input: []
  });
  await addRule({
    name: "CraftHideModel",
    type: "string-array",
    input: []
  });
  await addRule({
    name: "CraftHideId",
    type: "number-array",
    input: []
  });
}
