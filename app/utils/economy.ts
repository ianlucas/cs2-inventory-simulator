import { CS_CategoryMenuItem, CS_Economy, CS_Item } from "cslib";

export const instaSelectCategory = [
  "sticker",
  "agent",
  "pin",
  "patch",
  "musickit"
];

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

export function getBaseItems({ category }: CS_CategoryMenuItem) {
  const isDisplayAll = instaSelectCategory.includes(category);
  return CS_Economy.filter({
    category: category !== "sticker" ? category : undefined,
    type: category === "sticker" ? "sticker" : undefined,
    base: isDisplayAll ? undefined : true
  }).filter(({ free }) =>
    !["glove", "melee", "musickit"].includes(category) || !free
    || (isDisplayAll && (category !== "musickit" || !free))
  );
}

export function getPaidItems(
  { category }: CS_CategoryMenuItem,
  model: string
) {
  return CS_Economy.filter({
    model
  }).filter(({ base }) => category === "melee" || !base);
}
