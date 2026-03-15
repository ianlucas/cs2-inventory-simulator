/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface ServerRulesSection {
  id: string;
  title: string;
  body: string;
}

export const serverRulesSections: ServerRulesSection[] = [
  {
    id: "behavior",
    title: "Behavior",
    body:
      "Treat all players with respect. Harassment, hate speech, and personal attacks are not allowed. Communicate in a way that keeps the server welcoming for everyone."
  },
  {
    id: "no-cheating",
    title: "No Cheating",
    body:
      "Cheating, exploiting, or using unauthorized software is strictly prohibited. This includes aim assistance, wallhacks, and any other form of unfair advantage. Violations result in a permanent ban."
  },
  {
    id: "respect",
    title: "Respect",
    body:
      "Respect server staff and their decisions. Do not argue in chat; use appropriate channels to appeal. Disrespect toward admins or other players may lead to mutes or bans."
  },
  {
    id: "consequences",
    title: "Consequences",
    body:
      "Breaking the rules may result in a warning, mute, kick, or ban depending on severity and history. Repeated or serious violations can lead to permanent removal from the server."
  }
];
