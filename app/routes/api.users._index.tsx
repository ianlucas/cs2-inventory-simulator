/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/db.server";
import { isValidApiRequest } from "~/middlewares/is-valid-api-request.server";
import { API_SCOPE } from "~/models/api-credential.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await isValidApiRequest(request, [API_SCOPE]);
  const url = new URL(request.url);
  const page = z
    .string()
    .transform((value) => Number(value))
    .parse(url.searchParams.get("page") ?? "0");
  const search = z.string().parse(url.searchParams.get("search") ?? "");
  const take = 10;
  const count = await prisma.user.count();
  const results = await prisma.user.findMany({
    select: {
      avatar: true,
      id: true,
      name: true,
      syncedAt: true,
      updatedAt: true,
      groups: {
        select: {
          groupId: true
        },
        take: 1,
        orderBy: {
          group: {
            priority: "desc"
          }
        }
      }
    },
    skip: page * take,
    take,
    orderBy: {
      syncedAt: "desc"
    },
    where:
      search.length > 0
        ? {
            name: { search },
            id: { search }
          }
        : undefined
  });
  return {
    results,
    controls: {
      count,
      size: Math.ceil(count / take)
    }
  };
}
