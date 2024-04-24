/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

export async function resolveDomain(request: Request) {
  return (
    (
      await prisma.domain.findFirst({
        select: {
          id: true
        },
        where: {
          id: new URL(request.url).hostname,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        }
      })
    )?.id ?? "localhost"
  );
}

export async function resolveUrlDomain(request: Request, originalUrl: string) {
  const requestUrl = new URL(request.url);
  const url = new URL(originalUrl);
  if (requestUrl.hostname === url.hostname) {
    return url.toString();
  }
  const domain = await prisma.domain.findFirst({
    select: {
      id: true
    },
    where: {
      id: requestUrl.hostname,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    }
  });
  if (domain !== null) {
    url.hostname = domain.id;
  }
  return url.toString();
}
