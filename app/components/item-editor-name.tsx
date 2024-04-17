/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cs2-lib";
import { useNameItem } from "~/hooks/use-name-item";
import { has } from "~/utils/misc";

const HAS_KIND_FIRST = [
  "weapon",
  "melee",
  "glove",
  "musickit",
  "sticker",
  "graffiti",
  "patch"
];

export function ItemEditorName({ item }: { item: CS_Item }) {
  const { rarity } = item;
  const nameItem = useNameItem();
  const [model, name] = nameItem(item, "editor-name");

  return (
    <div className="bg-gradient-to-r from-transparent via-black/30 to-transparent">
      {has(model) && <div className="text-sm text-neutral-400">{model}</div>}
      <div className="-mt-2 font-bold" style={{ color: rarity }}>
        {name}
      </div>
    </div>
  );
}
