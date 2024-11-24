/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { serverGlobals } from "./globals";
import { appLogoUrl } from "./models/rule.server";

export async function setupLogo() {
  try {
    const url = await appLogoUrl.get();
    if (url === "") {
      return;
    }
    const response = await fetch(url);
    const string = Buffer.from(await response.arrayBuffer()).toString("base64");
    const mimeType = response.headers.get("content-type");
    const base64Url = `data:${mimeType};base64,${string}`;
    serverGlobals.appLogoBase64Url = base64Url;
  } catch {
    console.error("Unable to fetch application logo.");
  }
}
