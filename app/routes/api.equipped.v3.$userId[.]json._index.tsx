/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { middleware } from "~/http.server";
import { getRules } from "~/models/rule.server";
import { handleUserCachedResponse } from "~/models/user-cache.server";
import { generate } from "~/utils/inventory-equipped-v3";

export const ApiEquippedV3UserIdJsonUrl = "/api/equipped/v3/$userId.json";

export async function loader({ params, request }: LoaderFunctionArgs) {
  await middleware(request);
  const userId = z.string().parse(params.userId);
  const { inventoryItemEquipHideModel, inventoryItemEquipHideType } =
    await getRules(
      ["inventoryItemEquipHideModel", "inventoryItemEquipHideType"],
      userId
    );
  const args = [inventoryItemEquipHideModel, inventoryItemEquipHideType].join(
    ";"
  );
  return await handleUserCachedResponse({
    args,
    generate(item) {
      return generate(item, {
        models: inventoryItemEquipHideModel,
        types: inventoryItemEquipHideType
      });
    },
    mimeType: "application/json",
    request,
    throwBody: {},
    url: ApiEquippedV3UserIdJsonUrl,
    userId
  });
}
