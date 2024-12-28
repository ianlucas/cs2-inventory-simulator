/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Session } from "react-router";

export async function getToggleable(session: Session) {
  return {
    statsForNerds: session.get("statsForNerds") === "true" || false,
    hideFreeItems: session.get("hideFreeItems") === "true" || false,
    hideFilters: session.get("hideFilters") === "true" || false
  };
}
