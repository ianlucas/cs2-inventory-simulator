/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory } from "@ianlucas/cs2-lib";
import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { api } from "~/api.server";
import { middleware } from "~/http.server";
import { getRules } from "~/models/rule.server";
import { handleUserCachedResponse } from "~/models/user-cache.server";
import { generate } from "~/utils/inventory-equipped-v3";

export const ApiEquippedV3UserIdJsonUrl = "/api/equipped/v3/$userId.json";

export const loader = api(async ({ params, request }: LoaderFunctionArgs) => {
  await middleware(request);
  const userId = z.string().parse(params.userId);
  const {
    inventoryItemEquipHideModel,
    inventoryItemEquipHideType,
    inventoryMaxItems,
    inventoryStorageUnitMaxItems
  } = await getRules(
    [
      "inventoryItemEquipHideModel",
      "inventoryItemEquipHideType",
      "inventoryMaxItems",
      "inventoryStorageUnitMaxItems"
    ],
    userId
  );
  const args = [inventoryItemEquipHideModel, inventoryItemEquipHideType].join(
    ";"
  );
  return await handleUserCachedResponse({
    args,
    generate(data) {
      return generate(
        new CS2Inventory({
          data,
          maxItems: inventoryMaxItems,
          storageUnitMaxItems: inventoryStorageUnitMaxItems
        }),
        {
          models: inventoryItemEquipHideModel,
          types: inventoryItemEquipHideType
        }
      );
    },
    mimeType: "application/json",
    throwBody: {},
    url: ApiEquippedV3UserIdJsonUrl,
    userId
  });
});
