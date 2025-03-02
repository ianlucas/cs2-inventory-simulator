/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, ensure } from "@ianlucas/cs2-lib";
import { z } from "zod";
import { api } from "~/api.server";
import { serverGlobals } from "~/globals";
import { middleware } from "~/http.server";
import {
  API_SCOPE,
  INVENTORY_SCOPE,
  isApiKeyValid
} from "~/models/api-credential.server";
import { findUniqueUser, manipulateUserInventory } from "~/models/user.server";
import { badRequest, methodNotAllowed, unauthorized } from "~/responses.server";
import { random } from "~/utils/misc";
import type { Route } from "./+types/api.add-container._index";

export const action = api(async ({ request }: Route.ActionArgs) => {
  await middleware(request);
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }
  const {
    apiKey,
    graffiti,
    language,
    name,
    souvenir,
    stickerCapsule,
    userId,
    weapon
  } = z
    .object({
      apiKey: z.string(),
      graffiti: z.boolean().optional(),
      language: z.string().optional(),
      name: z.string().optional(),
      souvenir: z.boolean().optional(),
      stickerCapsule: z.boolean().optional(),
      userId: z.string(),
      weapon: z.boolean().optional()
    })
    .parse(await request.json());

  if (!(await isApiKeyValid(apiKey, [API_SCOPE, INVENTORY_SCOPE]))) {
    throw unauthorized;
  }

  try {
    const item = ensure(
      random(
        CS2Economy.itemsAsArray.filter(
          (item) =>
            item.isContainer() &&
            (name === undefined ||
              item.name.toLowerCase().includes(name.toLowerCase())) &&
            (souvenir !== true || item.isSouvenirCase()) &&
            (stickerCapsule !== true || item.isStickerCapsule()) &&
            (weapon !== true || item.isWeaponCase()) &&
            (graffiti !== true || item.isGraffitiBox())
        )
      )
    );
    const { inventory: rawInventory } = await findUniqueUser(userId);
    await manipulateUserInventory({
      rawInventory,
      userId,
      manipulate(inventory) {
        inventory.add({
          id: item.id
        });
      }
    });
    return Response.json({
      ...item.item,
      ...(language !== undefined
        ? serverGlobals.itemTranslationByLanguage[language][item.id]
        : item.language)
    });
  } catch {
    return badRequest;
  }
});

export { loader } from "./api.$";
