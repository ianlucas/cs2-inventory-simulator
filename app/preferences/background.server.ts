/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Session } from "react-router";
import { backgroundValues } from "~/data/backgrounds";

export const defaultBackground = "sirocco_night";

export function isValidBackground(background: string) {
  if (background.length === 0) {
    return true;
  }
  return backgroundValues.includes(background);
}

export function transformBackground(background: string) {
  return background === "" ? null : background;
}

export function getSessionBackground(session: Session) {
  return session.get("background") as string | null;
}

export async function getBackground(session: Session) {
  const background = getSessionBackground(session);
  return { background };
}
