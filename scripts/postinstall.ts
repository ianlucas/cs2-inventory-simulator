/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import lock from "../package-lock.json" assert { type: "json" };

const { version } = lock.packages["node_modules/@ianlucas/cs2-lib"];
const utilsEconomyPath = resolve(process.cwd(), "app/utils/economy.ts");
const contents = await readFile(utilsEconomyPath, "utf-8");
await writeFile(
  utilsEconomyPath,
  contents.replace(/"\?v=[^"]+"/, `"?v=${version}"`)
);
