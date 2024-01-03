/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

export async function isApiKeyValid(apiKey: string) {
  return (
    (await prisma.apiCredential.findFirst({
      select: {
        apiKey: true
      },
      where: { apiKey }
    })) !== null
  );
}
