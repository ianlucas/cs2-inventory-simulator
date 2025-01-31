/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useLocalize } from "./app-context";
import { ItemEditorAttributes, ItemEditorV2 } from "./item-editor-v2";
import { ModalButton } from "./modal-button";

export function CraftView({
  item,
  onCancel,
  onSubmit
}: {
  item: CS2InventoryItem | CS2EconomyItem;
  onCancel: () => void;
  onSubmit: (attributes: ItemEditorAttributes) => void;
}) {
  const localize = useLocalize();
  const [attributes, setAttributes] = useState<ItemEditorAttributes>();

  function handleSubmit() {
    if (attributes !== undefined) {
      onSubmit(attributes);
    }
  }

  return (
    <>
      <ItemEditorV2
        className="px-4"
        item={item}
        onChange={setAttributes}
        isDisabled
      />
      <div className="my-6 flex justify-center gap-2">
        <ModalButton
          variant="secondary"
          onClick={onCancel}
          children={localize("EditorCancel")}
        />
        <ModalButton
          children={localize("EditorCraft")}
          onClick={handleSubmit}
          variant="primary"
        />
      </div>
    </>
  );
}
