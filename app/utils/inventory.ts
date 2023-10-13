import { CS_Inventory, CS_Item } from "cslib";

function getItemName(csItem: CS_Item) {
  if (["weapon", "melee"].includes(csItem.type)) {
    const [weaponName, ...paintName] = csItem.name.split("|");
    return {
      model: (csItem.type === "melee" ? "★ " : "") + weaponName.trim(),
      name: paintName.join("|")
    };
  }
  return {
    model: "@TODO",
    name: csItem.name
  };
}

export function transform(
  { csItem, inventoryItem, index }: ReturnType<
    InstanceType<typeof CS_Inventory>["getAll"]
  >[number]
) {
  return {
    csItem,
    inventoryItem,
    index,
    equipped: [
      inventoryItem.equipped && "text-white",
      inventoryItem.equippedCT && "text-sky-300",
      inventoryItem.equippedT && "text-yellow-400"
    ],
    ...getItemName(csItem)
  };
}
