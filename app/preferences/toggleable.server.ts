/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Session } from "react-router";

export async function getToggleable(session: Session) {
  return {
    hideFilters: session.get("hideFilters") === "true" || false,
    hideFreeItems: session.get("hideFreeItems") === "true" || false,
    hideNewItemLabel: session.get("hideNewItemLabel") === "true" || false,
    statsForNerds: session.get("statsForNerds") === "true" || false
  };
}
