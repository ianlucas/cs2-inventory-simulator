/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type CS2ItemTranslationByLanguage } from "@ianlucas/cs2-lib";
import { type SystemTranslationByLanguage } from "~/translation.server";

interface ServerGlobals {
  appLogoBase64Url: string | undefined;
  itemTranslationByLanguage: CS2ItemTranslationByLanguage;
  systemTranslationByLanguage: SystemTranslationByLanguage;
}

interface ClientGlobals {
  splash: {
    end: () => void;
    loaded: boolean;
    n: number;
    render: () => void;
  };

  isTranslationLoaded?: boolean;
  itemTranslationMap: CS2ItemTranslationByLanguage[string];
  systemTranslationMap: SystemTranslationByLanguage[string];

  inspectedItem?: unknown;
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
