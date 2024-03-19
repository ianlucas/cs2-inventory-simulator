/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";
import { STEAM_API_KEY, STEAM_CALLBACK_URL } from "~/env.server";
import { fail } from "~/utils/misc";

const numberRulesNames = [
  "InventoryMaxItems",
  "InventoryStorageUnitMaxItems"
] as const;
const stringRulesNames = ["SteamApiKey", "SteamCallbackUrl"] as const;

export type NumberRuleNames = (typeof numberRulesNames)[number];
export type StringRuleNames = (typeof stringRulesNames)[number];
export type RuleNames = NumberRuleNames | StringRuleNames;
export type RuleTypes = "string" | "boolean" | "number";

export function getRule(name: StringRuleNames): Promise<string>;
export function getRule(name: NumberRuleNames): Promise<number>;
export async function getRule(name: RuleNames) {
  const rule = await prisma.rule.findUniqueOrThrow({
    where: { name }
  });
  if (numberRulesNames.includes(name as NumberRuleNames)) {
    return Number(rule.value);
  }
  if (stringRulesNames.includes(name as StringRuleNames)) {
    return rule.value;
  }
  fail("Rule not found.");
}

export async function setRule(
  type: RuleTypes,
  name: RuleNames,
  input: unknown
) {
  if (type === "string" && typeof input !== "string") {
    fail("invalid string");
  }
  if (type === "number" && typeof input !== "number") {
    fail("invalid number");
  }
  if (type === "boolean" && typeof input !== "boolean") {
    fail("invalid boolean");
  }
  const data = {
    name,
    type,
    value: String(input)
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
  value: string;
}) {
  if ((await prisma.rule.count({ where: { name: data.name } })) > 0) {
    return;
  }
  await prisma.rule.create({ data });
}

export async function setupRules() {
  await addRule({
    name: "InventoryMaxItems",
    type: "number",
    value: "256"
  });
  await addRule({
    name: "InventoryStorageUnitMaxItems",
    type: "number",
    value: "32"
  });
  await addRule({
    name: "SteamApiKey",
    type: "string",
    value: STEAM_API_KEY ?? "YOUR_STEAM_API_KEY_GOES_HERE"
  });
  await addRule({
    name: "SteamCallbackUrl",
    type: "string",
    value: STEAM_CALLBACK_URL ?? "http://localhost/sign-in/steam/callback"
  });
}
