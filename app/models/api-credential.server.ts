/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

export const API_SCOPE = "api";
export const API_AUTH_SCOPE = "api_auth";
export const STATTRAK_INCREMENT_SCOPE = "stattrak_increment";

export async function isApiKeyValid(apiKey: string, scope?: string[]) {
  const credentials = await prisma.apiCredential.findFirst({
    select: {
      scope: true
    },
    where: { apiKey }
  });
  if (!credentials) {
    return false;
  }
  const credentialScope =
    credentials.scope?.split(",").map((scope) => scope.trim()) ?? [];
  return scope ? scope.some((scope) => credentialScope.includes(scope)) : true;
}
