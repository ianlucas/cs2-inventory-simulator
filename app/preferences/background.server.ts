/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Session } from "@remix-run/node";
import { random } from "~/utils/misc";

export const defaultBackground = "sirocco_night";

export const backgrounds = [
  { label: "Ancient", value: "ancient" },
  { label: "Anubis", value: "anubis" },
  { label: "Apollo", value: "apollo" },
  { label: "Blacksite", value: "blacksite" },
  { label: "Cobblestone", value: "cbble" },
  { label: "Chlorine", value: "chlorine" },
  { label: "County", value: "county" },
  { label: "Engage", value: "engage" },
  { label: "Guard", value: "guard" },
  { label: "Mutiny", value: "mutiny" },
  { label: "Nuke", value: "nuke" },
  { label: "Sirocco Night", value: "sirocco_night" },
  { label: "Sirocco", value: "sirocco" },
  { label: "Swamp", value: "swamp" },
  { label: "Vertigo", value: "vertigo" }
];

export function getAllowedBackgrounds() {
  return backgrounds.map(({ value }) => value);
}

export function isValidBackground(background: string) {
  if (background.length === 0) {
    return true;
  }
  return getAllowedBackgrounds().includes(background);
}

export function transformBackground(background: string) {
  return background === "" ? null : background;
}

export function getSessionBackground(session: Session) {
  return session.get("background") as string | null;
}

export async function getBackground(session: Session) {
  return {
    background: getSessionBackground(session) || random(backgrounds).value
  };
}

export async function getCurrentBackground(session: Session) {
  return {
    currentBackground: getSessionBackground(session)
  };
}
