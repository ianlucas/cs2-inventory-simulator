import { CS_Item } from "cslib";
import { CSItemButton } from "./cs-item-button";
import { GridList } from "./grid-list";

export function CSItemBrowser({
  ignoreRarityColor,
  csItems,
  onClick
}: {
  ignoreRarityColor?: boolean;
  csItems: CS_Item[];
  onClick?(csItem: CS_Item): void;
}) {
  return (
    <GridList itemHeight={64} maxItemsIntoView={6}>
      {csItems.map((csItem) => (
        <CSItemButton
          ignoreRarityColor={ignoreRarityColor}
          csItem={csItem}
          key={csItem.id}
          onClick={onClick}
        />
      ))}
    </GridList>
  );
}
