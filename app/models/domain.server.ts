/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";
import { getRule } from "./rule.server";

export async function resolveDomain(request: Request) {
  const appUrl = new URL(await getRule("steamCallbackUrl"));
  const url = new URL(appUrl);
  if (request.url === url.pathname) {
    return url.hostname;
  }
  return (
    (
      await prisma.domain.findFirst({
        select: {
          id: true
        },
        where: {
          id: url.hostname,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        }
      })
    )?.id ?? appUrl.hostname
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
