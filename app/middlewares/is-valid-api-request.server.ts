/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { z } from "zod";
import { isApiKeyValid } from "~/models/api-credential.server";
import { unauthorized } from "~/responses.server";

export async function isValidApiRequest(request: Request, scope?: string[]) {
  const apiKey = z
    .string()
    .parse(request.headers.get("Authorization")?.replace("Bearer ", ""));
  if (!(await isApiKeyValid(apiKey, scope))) {
    throw unauthorized;
  }
}
