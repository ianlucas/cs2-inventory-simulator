/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { z } from "zod";
import { api } from "~/api.server";
import { prisma } from "~/db.server";
import { middleware } from "~/http.server";
import { isValidApiRequest } from "~/middlewares/is-valid-api-request.server";
import { API_SCOPE } from "~/models/api-credential.server";
import type { Route } from "./+types/api.users._index";

export const loader = api(async ({ request }: Route.LoaderArgs) => {
  middleware(request);
  await isValidApiRequest(request, [API_SCOPE]);
  const url = new URL(request.url);
  const page = z
    .string()
    .transform((value) => Number(value))
    .parse(url.searchParams.get("page") ?? "0");
  const search = z
    .string()
    .parse(url.searchParams.get("search") ?? "")
    // @see https://github.com/prisma/prisma/issues/8939#issuecomment-933990947
    .replace(/[\s\n\t]/g, "_");
  const take = 10;
  const where =
    search.length > 0
      ? {
          name: { search },
          id: { search }
        }
      : undefined;
  const count = await prisma.user.count({ where });
  const results = await prisma.user.findMany({
    select: {
      avatar: true,
      id: true,
      name: true,
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
    where
  });
  return Response.json({
    results,
    controls: {
      count,
      size: Math.ceil(count / take)
    }
  });
});
