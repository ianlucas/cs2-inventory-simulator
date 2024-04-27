/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

export function getRequestHostname(request: Request) {
  return new URL(request.url).hostname;
}

export async function isValidDomain(hostname: string) {
  return (
    (await prisma.domain.findFirst({
      select: {
        hostname: true
      },
      where: {
        hostname,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }]
      }
    })) !== null
  );
}

export async function getDomainImage(request: Request) {
  const hostname = getRequestHostname(request);
  return (
    (
      await prisma.domain.findFirst({
        select: {
          image: true
        },
        where: {
          hostname,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }]
        }
      })
    )?.image ?? undefined
  );
}
