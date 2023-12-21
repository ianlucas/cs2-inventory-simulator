/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Session } from "@remix-run/node";

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
  { label: "Search", value: "search" },
  { label: "Sirocco Night", value: "sirocco_night" },
  { label: "Sirocco", value: "sirocco" },
  { label: "Swamp", value: "swamp" },
  { label: "Vertigo", value: "vertigo" }
];

export function getAllowedBackgrounds() {
  return backgrounds.map(({ value }) => value);
}

export async function getBackground(session: Session) {
  return {
    background: session.get("background") || defaultBackground
  };
}
