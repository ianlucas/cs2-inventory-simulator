/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MetaFunction } from "react-router";
import { loader as rootLoader } from "~/root";
import { DEFAULT_APP_NAME } from "./app-defaults";
import { getSystemTranslation } from "./utils/translation";

export function getMetaTitle(
  key?: string
): MetaFunction<any, { root: typeof rootLoader }> {
  return function meta({ matches }) {
    const rootData = matches.find((match) => match.id === "root");
    const appName = rootData?.data?.rules.appName || DEFAULT_APP_NAME;
    const pageTitle =
      key !== undefined
        ? getSystemTranslation(key, rootData?.data?.preferences.language)
        : undefined;
    return [
      { title: `${pageTitle !== undefined ? `${pageTitle} - ` : ""}${appName}` }
    ];
  };
}
