/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as mysql from "mysql2/promise";

import { singleton } from "./singleton.server";

export function getMySQLPool(): mysql.Pool | null {
  const url = process.env.MYSQL_URL ?? undefined;
  if (url === undefined || url === "") {
    return null;
  }
  return singleton("mysql-pool", () => mysql.createPool(url));
}
