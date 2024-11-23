/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import lock from "../package-lock.json" assert { type: "json" };

const { version } = lock.packages["node_modules/@ianlucas/cs2-lib"];
const {
  object: { sha }
} = (await (
  await fetch(
    `https://api.github.com/repos/ianlucas/cs2-lib/git/ref/tags/${version}`
  )
).json()) as {
  object: {
    sha: string;
  };
};

const utilsEconomyPath = resolve(process.cwd(), "app/utils/economy.ts");
const contents = await readFile(utilsEconomyPath, "utf-8");
await writeFile(
  utilsEconomyPath,
  contents.replace(
    /"[^"]+cdn.statically.io[^"]+"/,
    `"https://cdn.statically.io/gh/ianlucas/cs2-lib/${sha}/assets/images"`
  )
);
