/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { api } from "~/api.server";
import { middleware } from "~/middleware.server";
import { getRules } from "~/models/rule";
import {
  inventoryItemEquipHideModel,
  inventoryItemEquipHideType
} from "~/models/rule.server";
import { handleUserCachedResponse } from "~/models/user-cache.server";
import { generate } from "~/utils/inventory-equipped-v4";
import type { Route } from "./+types/api.equipped.v4.$userId[.]json._index";

export const ApiEquippedV4UserIdJsonUrl = "/api/equipped/v4/$userId.json";

export const loader = api(
  async ({ params: { userId }, request }: Route.LoaderArgs) => {
    await middleware(request, userId);
    const rules = await getRules(
      {
        inventoryItemEquipHideModel,
        inventoryItemEquipHideType
      },
      userId
    );
    const args = [
      rules.inventoryItemEquipHideModel,
      rules.inventoryItemEquipHideType
    ].join(";");
    return await handleUserCachedResponse({
      args,
      generate(inventory) {
        return generate(inventory, {
          models: rules.inventoryItemEquipHideModel,
          types: rules.inventoryItemEquipHideType
        });
      },
      throwBody: {},
      url: ApiEquippedV4UserIdJsonUrl,
      userId
    });
  }
);
