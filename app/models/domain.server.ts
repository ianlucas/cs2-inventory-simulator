/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

export async function isValidDomain(hostname: string) {
  return (
    (await prisma.domain.count({
      where: { hostname }
    })) > 0
  );
}
