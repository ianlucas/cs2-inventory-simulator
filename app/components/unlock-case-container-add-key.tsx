/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert, CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useToggle } from "@uidotdev/usehooks";
import { useState } from "react";
import { dispatchAppEvent } from "~/app";
import { SyncAction } from "~/data/sync";
import { toArrayIf } from "~/utils/misc";
import { range } from "~/utils/number";
import { useInventory, useRules, useTranslate } from "./app-context";
import { useSync } from "./hooks/use-sync";
import { ItemEditor, ItemEditorAttributes } from "./item-editor";
import { Modal, ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";
import { Select } from "./select";

const KEY_MAX_QUANTITY = 20;

export function UnlockCaseContainerAddKey({
  caseUid,
  neededKeyItem
}: {
  caseUid: number;
  neededKeyItem: CS2EconomyItem;
}) {
  const translate = useTranslate();
  const sync = useSync();
  const [inventory, setInventory] = useInventory();
  const { craftMaxQuantity, inventoryMaxItems } = useRules();
  const [amount, setAmount] = useState("1");
  const [isCrafting, toggleIsCrafting] = useToggle(false);
  const [attributes, setAttributes] = useState<ItemEditorAttributes>();

  const maxQuantity = Math.min(
    inventoryMaxItems - inventory.size(),
    KEY_MAX_QUANTITY,
    ...toArrayIf(craftMaxQuantity, (n) => n > 0)
  );

  function handleClose() {
    toggleIsCrafting();
  }

  function handleCraft() {
    assert(attributes);
    const inventoryItem = { id: neededKeyItem.id };
    range(attributes.quantity).forEach(() => {
      setInventory(inventory.add(inventoryItem));
      sync({
        type: SyncAction.Add,
        item: inventoryItem
      });
    });
    const firstKey = inventory
      .getAll()
      .find((item) => item.id === neededKeyItem.id);
    if (firstKey !== undefined) {
      dispatchAppEvent("unlockcase", {
        caseUid,
        keyUid: firstKey.uid
      });
    }
  }

  return maxQuantity === 0 ? null : (
    <div className="mr-2 flex items-center gap-2 border-r border-r-white/10 pr-4">
      <Select
        direction="up"
        value={amount}
        onChange={setAmount}
        options={range(maxQuantity).map((n) => ({
          value: (n + 1).toString()
        }))}
        noMaxHeight
        className="min-w-[64px]"
        optionsStyles="max-h-[256px] overflow-y-scroll"
      />
      <ModalButton
        children={translate("CaseAdd")}
        variant="primary"
        onClick={handleClose}
      />
      {isCrafting && (
        <Modal className="w-[420px]" fixed>
          <ModalHeader
            title={translate("CaseAddKeyConfirm")}
            onClose={handleClose}
          />
          <ItemEditor
            className="px-4"
            defaultQuantity={Number(amount)}
            item={neededKeyItem}
            maxQuantity={maxQuantity}
            onChange={setAttributes}
          />
          <div className="my-6 flex justify-center gap-2">
            <ModalButton
              children={translate("EditorCancel")}
              onClick={handleClose}
              variant="secondary"
            />
            <ModalButton
              children={translate("EditorCraft")}
              onClick={handleCraft}
              variant="primary"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
