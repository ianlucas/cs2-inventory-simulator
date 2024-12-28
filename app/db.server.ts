/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PrismaClient } from "@prisma/client/index.js";

import { singleton } from "./singleton.server";

const prisma = singleton(
  "prisma",
  () =>
    new PrismaClient({
      log: []
    })
);
prisma.$connect();

export { prisma };
