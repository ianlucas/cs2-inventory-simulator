/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2ItemType } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { ItemEditorName } from "./item-editor-name";
import { ItemImage } from "./item-image";

export function EditorItemDisplay({
  item,
  wear
}: {
  item: CS2EconomyItem;
  wear?: number;
}) {
  return (
    <>
      <ItemImage
        className="m-auto w-[256px]"
        item={item}
        wear={item.hasWear() ? wear : undefined}
      />
      <div
        className={clsx(
          "mb-4 text-center",
          item.type === CS2ItemType.Agent && "mt-4"
        )}
      >
        <ItemEditorName item={item} />
      </div>
    </>
  );
}
