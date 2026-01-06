/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory } from "@ianlucas/cs2-lib";
import { api } from "~/api.server";
import { middleware } from "~/http.server";
import { getRules } from "~/models/rule";
import {
  inventoryItemEquipHideModel,
  inventoryItemEquipHideType,
  inventoryMaxItems,
  inventoryStorageUnitMaxItems
} from "~/models/rule.server";
import { handleUserCachedResponse } from "~/models/user-cache.server";
import { generate } from "~/utils/inventory-equipped-v4";
import type { Route } from "./+types/api.equipped.v4.$userId[.]json._index";

export const ApiEquippedV4UserIdJsonUrl = "/api/equipped/v4/$userId.json";

export const loader = api(
  async ({ params: { userId }, request }: Route.LoaderArgs) => {
    await middleware(request);
    const rules = await getRules(
      {
        inventoryItemEquipHideModel,
        inventoryItemEquipHideType,
        inventoryMaxItems,
        inventoryStorageUnitMaxItems
      },
      userId
    );
    const args = [
      rules.inventoryItemEquipHideModel,
      rules.inventoryItemEquipHideType
    ].join(";");
    return await handleUserCachedResponse({
      args,
      generate(data) {
        return generate(
          new CS2Inventory({
            data,
            maxItems: rules.inventoryMaxItems,
            storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
          }),
          {
            models: rules.inventoryItemEquipHideModel,
            types: rules.inventoryItemEquipHideType
          }
        );
      },
      mimeType: "application/json",
      throwBody: {},
      url: ApiEquippedV4UserIdJsonUrl,
      userId
    });
  }
);
