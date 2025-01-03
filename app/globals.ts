/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type CS2ItemLocalizationByLanguage } from "@ianlucas/cs2-lib";
import { type SystemLocalizationByLanguage } from "~/localization.server";

interface ServerGlobals {
  appLogoBase64Url: string | undefined;
  itemLocalizationByLanguage: CS2ItemLocalizationByLanguage;
  systemLocalizationByLanguage: SystemLocalizationByLanguage;
}

interface ClientGlobals {
  splash: {
    end: () => void;
    loaded: boolean;
    n: number;
    render: () => void;
  };

  assetsBaseUrl: string | undefined;
  itemLocalizationMap: CS2ItemLocalizationByLanguage[string];
  systemLocalizationMap: SystemLocalizationByLanguage[string];
}

type Globals = ServerGlobals & ClientGlobals;

declare global {
  var InventorySimulator: Globals;
  interface Window {
    InventorySimulator: Globals;
  }
}

export const isServerContext = typeof global !== "undefined";

const context = isServerContext ? global : window;
if (context.InventorySimulator === undefined) {
  context.InventorySimulator = {} as Globals;
}

const globals = context.InventorySimulator;

export const serverGlobals = globals as ServerGlobals;
export const clientGlobals = globals as ClientGlobals;
