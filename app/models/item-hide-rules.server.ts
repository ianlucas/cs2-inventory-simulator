/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2EconomyItem } from "@ianlucas/cs2-lib";
import {
  craftHideCategory,
  craftHideFilterType,
  craftHideId,
  craftHideModel,
  craftHideType,
  editHideCategory,
  editHideId,
  editHideModel,
  editHideType
} from "./rule.server";

export const craftHideRules = {
  hideId: craftHideId,
  hideCategory: craftHideCategory,
  hideType: craftHideType,
  hideModel: craftHideModel
};

export const editHideRules = {
  hideId: editHideId,
  hideCategory: editHideCategory,
  hideType: editHideType,
  hideModel: editHideModel
};

export async function enforceItemHideRules(
  idOrItem: number | CS2EconomyItem,
  userId: string,
  {
    hideId,
    hideCategory,
    hideType,
    hideModel
  }: typeof craftHideRules | typeof editHideRules
) {
  const item = CS2Economy.get(idOrItem);
  const { type, modelKey, id, loadoutCategory } = item;
  await hideId.for(userId).notContains(id);
  if (loadoutCategory !== undefined) {
    await hideCategory.for(userId).notContains(loadoutCategory);
  }
  if (type !== undefined) {
    await hideType.for(userId).notContains(type);
  }
  if (modelKey !== undefined) {
    await hideModel.for(userId).notContains(modelKey);
  }
}

export async function enforceCraftItemHideRules(
  idOrItem: number | CS2EconomyItem,
  userId: string
) {
  const item = CS2Economy.get(idOrItem);
  await enforceItemHideRules(item, userId, craftHideRules);
  await craftHideFilterType.for(userId).notContains(item.type);
}
