/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert, fail } from "@ianlucas/cs2-lib";
import { z } from "zod";
import { prisma } from "~/db.server";
import { STEAM_API_KEY, STEAM_CALLBACK_URL } from "~/env.server";
import { noop } from "~/utils/misc";

class RuleFor<RuleValue> {
  constructor(private value: Promise<RuleValue>) {}

  async get() {
    return await this.value;
  }

  async truthy() {
    assert((await this.value) === true);
  }

  async notContains(what: unknown) {
    const value = await this.value;
    assert(Array.isArray(value));
    assert(!value.includes(what));
  }
}

export class Rule<RuleName extends string, RuleValue> {
  static instances: Rule<any, any>[] = [];
  public defaultValue: RuleValue;
  private type: RuleValue extends string
    ? "string"
    : RuleValue extends number
      ? "number"
      : RuleValue extends boolean
        ? "boolean"
        : RuleValue extends string[]
          ? "string-array"
          : RuleValue extends number[]
            ? "number-array"
            : never;
  public name: RuleName;

  constructor({
    defaultValue,
    name,
    type
  }: {
    defaultValue: RuleValue;
    name: RuleName;
    type: Rule<RuleName, RuleValue>["type"];
  }) {
    this.defaultValue = defaultValue;
    this.name = name;
    this.type = type;
    Rule.instances.push(this);
  }

  private async getUserRuleOverwrite(userId: string) {
    return (
      await prisma.userRule.findUnique({
        select: { value: true },
        where: { name_userId: { userId, name: this.name } }
      })
    )?.value;
  }

  private async getUserGroupRuleOverwrite(userId: string) {
    return (
      await prisma.userGroup.findFirst({
        select: {
          group: {
            select: {
              overwrites: {
                select: { value: true },
                where: { name: this.name }
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
    )?.group.overwrites[0]?.value;
  }

  private toValue(str: string): RuleValue {
    switch (this.type) {
      case "string":
        return str as RuleValue;
      case "number":
        return Number(str) as RuleValue;
      case "boolean":
        return (str === "true") as RuleValue;
      case "string-array":
        return str
          .split(";")
          .map((value) => value.trim())
          .filter((value) => value !== "") as RuleValue;
      case "number-array":
        return str
          .split(";")
          .map((value) => value.trim())
          .filter((value) => value !== "")
          .map(Number) as RuleValue;
      default:
        fail();
    }
  }

  async register() {
    if ((await prisma.rule.count({ where: { name: this.name } })) === 0) {
      await this.set(this.defaultValue);
    }
  }

  async set(value: RuleValue) {
    let strValue = String(value);
    switch (this.type) {
      case "number":
        assert(strValue.match(/^\d+$/) !== null);
        break;

      case "boolean":
        assert(strValue === "true" || strValue === "false");
        break;

      case "string-array":
        const transform = z.array(z.string()).safeParse(value);
        assert(transform.success);
        strValue = transform.data.join(";");
        break;

      case "number-array":
        const transform2 = z.array(z.number()).safeParse(value);
        assert(transform2.success);
        strValue = transform2.data.join(";");
        break;
    }
    prisma.rule
      .upsert({
        where: {
          name: this.name
        },
        update: {
          value: strValue
        },
        create: {
          name: this.name,
          type: this.type,
          value: strValue
        }
      })
      .then(noop);
  }

  async get() {
    const value = (await prisma.rule.findUnique({ where: { name: this.name } }))
      ?.value;
    return value !== undefined ? this.toValue(value) : this.defaultValue;
  }

  for(userId: string): RuleFor<RuleValue> {
    return new RuleFor(
      new Promise(async (resolve) => {
        const value =
          (await this.getUserRuleOverwrite(userId)) ??
          (await this.getUserGroupRuleOverwrite(userId));
        resolve(value !== undefined ? this.toValue(value) : await this.get());
      })
    );
  }
}

export const inventoryMaxItems = new Rule({
  name: "inventoryMaxItems",
  type: "number",
  defaultValue: 256
});

export const inventoryStorageUnitMaxItems = new Rule({
  name: "inventoryStorageUnitMaxItems",
  type: "number",
  defaultValue: 32
});

export const appLogoUrl = new Rule({
  name: "appLogoUrl",
  type: "string",
  defaultValue: ""
});

export const appFaviconUrl = new Rule({
  name: "appFaviconUrl",
  type: "string",
  defaultValue: ""
});

export const appFaviconMimeType = new Rule({
  name: "appFaviconMimeType",
  type: "string",
  defaultValue: ""
});

export const appName = new Rule({
  name: "appName",
  type: "string",
  defaultValue: ""
});

export const appFooterName = new Rule({
  name: "appFooterName",
  type: "string",
  defaultValue: ""
});

export const appSeoDescription = new Rule({
  name: "appSeoDescription",
  type: "string",
  defaultValue: ""
});

export const appSeoImageUrl = new Rule({
  name: "appSeoImageUrl",
  type: "string",
  defaultValue: ""
});

export const appSeoTitle = new Rule({
  name: "appSeoTitle",
  type: "string",
  defaultValue: ""
});

export const appCountry = new Rule({
  name: "appCountry",
  type: "string",
  defaultValue: "us"
});

export const steamApiKey = new Rule({
  name: "steamApiKey",
  type: "string",
  defaultValue: STEAM_API_KEY ?? "YOUR_STEAM_API_KEY_GOES_HERE"
});

export const steamCallbackUrl = new Rule({
  name: "steamCallbackUrl",
  type: "string",
  defaultValue: STEAM_CALLBACK_URL ?? "http://localhost/sign-in/steam/callback"
});

export const inventoryItemAllowEdit = new Rule({
  name: "inventoryItemAllowEdit",
  type: "boolean",
  defaultValue: true
});

export const craftHideCategory = new Rule({
  name: "craftHideCategory",
  type: "string-array",
  defaultValue: [] as string[]
});

export const craftHideType = new Rule({
  name: "craftHideType",
  type: "string-array",
  defaultValue: [] as string[]
});

export const craftHideFilterType = new Rule({
  name: "craftHideFilterType",
  type: "string-array",
  defaultValue: [] as string[]
});

export const craftHideModel = new Rule({
  name: "craftHideModel",
  type: "string-array",
  defaultValue: [] as string[]
});

export const craftHideId = new Rule({
  name: "craftHideId",
  type: "number-array",
  defaultValue: [] as number[]
});

export const editHideCategory = new Rule({
  name: "editHideCategory",
  type: "string-array",
  defaultValue: [] as string[]
});

export const editHideType = new Rule({
  name: "editHideType",
  type: "string-array",
  defaultValue: [] as string[]
});

export const editHideModel = new Rule({
  name: "editHideModel",
  type: "string-array",
  defaultValue: [] as string[]
});

export const editHideId = new Rule({
  name: "editHideId",
  type: "number-array",
  defaultValue: [] as number[]
});

export const inventoryItemAllowApplyPatch = new Rule({
  name: "inventoryItemAllowApplyPatch",
  type: "boolean",
  defaultValue: true
});

export const inventoryItemAllowRemovePatch = new Rule({
  name: "inventoryItemAllowRemovePatch",
  type: "boolean",
  defaultValue: true
});

export const inventoryItemAllowApplySticker = new Rule({
  name: "inventoryItemAllowApplySticker",
  type: "boolean",
  defaultValue: true
});

export const inventoryItemAllowScrapeSticker = new Rule({
  name: "inventoryItemAllowScrapeSticker",
  type: "boolean",
  defaultValue: true
});

export const inventoryItemAllowShare = new Rule({
  name: "inventoryItemAllowShare",
  type: "boolean",
  defaultValue: true
});

export const inventoryItemEquipHideType = new Rule({
  name: "inventoryItemEquipHideType",
  type: "string-array",
  defaultValue: [] as string[]
});

export const inventoryItemEquipHideModel = new Rule({
  name: "inventoryItemEquipHideModel",
  type: "string-array",
  defaultValue: [] as string[]
});

export const inventoryItemAllowUnlockContainer = new Rule({
  name: "inventoryItemAllowUnlockContainer",
  type: "boolean",
  defaultValue: true
});

export const appCacheInventory = new Rule({
  name: "appCacheInventory",
  type: "boolean",
  defaultValue: true
});

export const craftAllowNametag = new Rule({
  name: "craftAllowNametag",
  type: "boolean",
  defaultValue: true
});

export const craftAllowSeed = new Rule({
  name: "craftAllowSeed",
  type: "boolean",
  defaultValue: true
});

export const craftAllowWear = new Rule({
  name: "craftAllowWear",
  type: "boolean",
  defaultValue: true
});

export const craftAllowStatTrak = new Rule({
  name: "craftAllowStatTrak",
  type: "boolean",
  defaultValue: true
});

export const craftAllowStickers = new Rule({
  name: "craftAllowStickers",
  type: "boolean",
  defaultValue: true
});

export const craftAllowPatches = new Rule({
  name: "craftAllowPatches",
  type: "boolean",
  defaultValue: true
});

export const craftMaxQuantity = new Rule({
  name: "craftMaxQuantity",
  type: "number",
  defaultValue: 0
});

export const editAllowNametag = new Rule({
  name: "editAllowNametag",
  type: "boolean",
  defaultValue: true
});

export const editAllowSeed = new Rule({
  name: "editAllowSeed",
  type: "boolean",
  defaultValue: true
});

export const editAllowWear = new Rule({
  name: "editAllowWear",
  type: "boolean",
  defaultValue: true
});

export const editAllowStatTrak = new Rule({
  name: "editAllowStatTrak",
  type: "boolean",
  defaultValue: true
});

export const editAllowStickers = new Rule({
  name: "editAllowStickers",
  type: "boolean",
  defaultValue: true
});

export const editAllowPatches = new Rule({
  name: "editAllowPatches",
  type: "boolean",
  defaultValue: true
});

export const inventoryItemAllowInspectInGame = new Rule({
  name: "inventoryItemAllowInspectInGame",
  type: "boolean",
  defaultValue: true
});
