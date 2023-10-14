import { CS_Item } from "cslib";

export function CSItemEditor({
  csItem
}: {
  csItem: CS_Item;
}) {
  return <div>Got {csItem.name}</div>;
}
