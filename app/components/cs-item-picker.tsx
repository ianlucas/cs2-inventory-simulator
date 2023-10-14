import clsx from "clsx";
import { CS_CATEGORY_MENU, CS_CategoryMenuItem, CS_Item, CS_Team, CS_TEAM_CT } from "cslib";
import { useState } from "react";
import { CategoryMenu } from "~/components/category-menu";
import { CSItemBrowser } from "~/components/cs-item-browser";
import { TeamToggle } from "~/components/team-toggle";
import { useInput } from "~/hooks/use-input";
import { getBaseItems, getPaidItems } from "~/utils/economy";

export default function CSItemPicker({
  onPickItem
}: {
  onPickItem(csItem: CS_Item): void;
}) {
  const [category, setCategory] = useState(CS_CATEGORY_MENU[0]);
  const [team, setTeam] = useState(CS_TEAM_CT);
  const [model, setModel] = useState<string | undefined>();
  const [query, setQuery] = useInput("");

  function reset() {
    setQuery("");
    setModel(undefined);
  }

  function handleCategoryClick(category: CS_CategoryMenuItem) {
    setCategory(category);
    return reset();
  }

  function handleTeamClick(team: CS_Team) {
    setTeam(team);
    return reset();
  }

  function handleItemClick(csItem: CS_Item) {
    if (csItem.teams === undefined || model !== undefined) {
      return onPickItem(csItem);
    }
    setQuery("");
    setModel(csItem.model);
  }

  const items = (model === undefined
    ? getBaseItems(category, team)
    : getPaidItems(category, team, model)).filter(
      ({ name }) => {
        if (query.length < 2) {
          return true;
        }
        return name.toLowerCase().includes(query.toLowerCase());
      }
    );

  const hideTeamToogle = category.category === "musickit";
  const ignoreRarityColor = model === undefined;

  return (
    <>
      <CategoryMenu value={category} onChange={handleCategoryClick} />
      <div
        className={clsx(
          "flex pr-4 my-2 gap-2 h-[36px]",
          hideTeamToogle ? "pl-4" : "pl-2"
        )}
      >
        {!hideTeamToogle && (
          <TeamToggle
            value={team}
            onChange={handleTeamClick}
          />
        )}
        <input
          value={query}
          onChange={setQuery}
          className="flex-1 bg-transparent outline-none placeholder-neutral-600"
          placeholder="Search for an item..."
        />
      </div>
      <div className="py-1">
        <CSItemBrowser
          csItems={items}
          onClick={handleItemClick}
          ignoreRarityColor={ignoreRarityColor}
        />
      </div>
    </>
  );
}
