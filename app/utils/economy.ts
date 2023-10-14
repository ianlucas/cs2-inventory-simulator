import { CS_CategoryMenuItem, CS_Economy, CS_Item, CS_Team } from "cslib";

export function getCSItemName(csItem: CS_Item) {
  if (["weapon", "melee", "glove"].includes(csItem.type)) {
    const [weaponName, ...paintName] = csItem.name.split("|");
    return {
      model: (csItem.type === "melee" ? "★ " : "") + weaponName.trim(),
      name: paintName.join("|")
    };
  }
  return {
    model: csItem.type === "musickit" ? "Music Kit" : "Sticker",
    name: csItem.name
  };
}

export function getBaseItems({ category }: CS_CategoryMenuItem, team: CS_Team) {
  return CS_Economy.filter({
    category,
    base: true,
    team
  }).filter(({ free }) =>
    !["glove", "melee", "musickit"].includes(category) || !free
  );
}

export function getPaidItems(
  { category }: CS_CategoryMenuItem,
  team: CS_Team,
  model: string
) {
  return CS_Economy.filter({
    model,
    team
  }).filter(({ base }) => category === "melee" || !base);
}
