/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useTranslate } from "./app-context";
import { ItemEditor, ItemEditorAttributes } from "./item-editor";
import { ModalButton } from "./modal-button";

export function CraftView({
  item,
  onClose,
  onSubmit
}: {
  item: CS2InventoryItem | CS2EconomyItem;
  onClose: () => void;
  onSubmit: (attributes: ItemEditorAttributes) => void;
}) {
  const translate = useTranslate();
  const [attributes, setAttributes] = useState<ItemEditorAttributes>();

  function handleSubmit() {
    if (attributes !== undefined) {
      onSubmit(attributes);
    }
  }

  return (
    <>
      <ItemEditor
        className="px-4"
        isDisabled
        item={item}
        onChange={setAttributes}
      />
      <div className="my-6 flex justify-center gap-2">
        <ModalButton
          children={translate("EditorCancel")}
          onClick={onClose}
          variant="secondary"
        />
        <ModalButton
          children={translate("EditorCraft")}
          onClick={handleSubmit}
          variant="primary"
        />
      </div>
    </>
  );
}
