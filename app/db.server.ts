/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

import { DATABASE_URL } from "./env.server";
import { singleton } from "./singleton.server";

const prisma = singleton(
  "prisma",
  () =>
    new PrismaClient({
      adapter: new PrismaPg({
        connectionString: DATABASE_URL
      }),
      log: []
    })
);
prisma.$connect();

export { prisma };
