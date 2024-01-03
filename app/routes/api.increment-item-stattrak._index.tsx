/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { middleware } from "~/http";
import { isApiKeyValid } from "~/models/api-credential.server";
import {
  existsUser,
  findUniqueUser,
  manipulateUserInventory
} from "~/models/user.server";
import {
  badRequest,
  noContent,
  notFound,
  unauthorized
} from "~/response.server";

export async function action({ request }: ActionFunctionArgs) {
  await middleware(request);
  if (request.method !== "POST") {
    throw notFound;
  }
  const { apiKey, userId, itemIndex } = z
    .object({
      apiKey: z.string(),
      userId: z.string(),
      itemIndex: z.number()
    })
    .parse(await request.json());

  if (!(await isApiKeyValid(apiKey))) {
    throw unauthorized;
  }

  if (!(await existsUser(userId))) {
    throw badRequest;
  }

  try {
    const { inventory: rawInventory } = await findUniqueUser(userId);
    await manipulateUserInventory(userId, rawInventory, (inventory) =>
      inventory.incrementItemStatTrak(itemIndex)
    );
    return noContent;
  } catch {
    return badRequest;
  }
}
