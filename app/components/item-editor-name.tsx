/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useNameItem } from "~/components/hooks/use-name-item";
import { has } from "~/utils/misc";

export function ItemEditorName({ item }: { item: CS2EconomyItem }) {
  const { rarity } = item;
  const nameItem = useNameItem();
  const [model, name] = nameItem(item, "editor-name");

  return (
    <div className="font-display bg-linear-to-r from-transparent via-black/30 to-transparent">
      {has(model) && <div className="text-sm text-neutral-400">{model}</div>}
      <div
        className={clsx(has(model) && "-mt-2", "font-bold")}
        style={{ color: rarity }}
      >
        {name}
      </div>
    </div>
  );
}
