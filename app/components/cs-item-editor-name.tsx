/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cs2-lib";
import { getItemName } from "~/utils/inventory";
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

export function CSItemEditorName({ item }: { item: CS_Item }) {
  const { type, rarity } = item;
  const [model, name] = getItemName(item, "editor-name");

  return (
    <div className="bg-gradient-to-r from-transparent via-black/30 to-transparent">
      {has(model) && <div className="text-sm text-neutral-400">{model}</div>}
      <div className="-mt-2 font-bold" style={{ color: rarity }}>
        {name}
      </div>
    </div>
  );
  /*
      {names.map((name, index) => (
        <span key={index} className="leading-3">
          <span
            className={clsx(
              index === 0 && HAS_KIND_FIRST.includes(type) && names.length > 1
                ? "text-sm text-neutral-400"
                : "font-bold"
            )}
            style={{
              color:
                index !== 0 ||
                !HAS_KIND_FIRST.includes(type) ||
                names.length === 1
                  ? rarity
                  : undefined
            }}
          >
            {name}
          </span>
          {index < names.length - 1 && <br />}
        </span>
      ))}
    </>
  );*/
}
