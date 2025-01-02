/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useToggle } from "@uidotdev/usehooks";
import { useState } from "react";
import { dispatchAppEvent } from "~/app";
import { SyncAction } from "~/data/sync";
import { range } from "~/utils/number";
import { useInventory, useLocalize, useRules } from "./app-context";
import { useSync } from "./hooks/use-sync";
import { ItemEditor, ItemEditorAttributes } from "./item-editor";
import { Modal } from "./modal";
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
  const localize = useLocalize();
  const sync = useSync();
  const [inventory, setInventory] = useInventory();
  const { inventoryMaxItems } = useRules();
  const [amount, setAmount] = useState("1");
  const [isCrafting, toggleIsCrafting] = useToggle(false);
  const maxQuantity = Math.min(
    inventoryMaxItems - inventory.size(),
    KEY_MAX_QUANTITY
  );

  function craft({ quantity }: ItemEditorAttributes) {
    const inventoryItem = { id: neededKeyItem.id };
    range(quantity).forEach(() => {
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
        children={localize("CaseAdd")}
        variant="primary"
        onClick={() => toggleIsCrafting()}
      />
      {isCrafting && (
        <Modal className="w-[420px]" fixed>
          <div className="flex select-none items-center justify-between px-4 py-2 text-sm font-bold">
            <span className="text-neutral-400">
              {localize("CaseAddKeyConfirm")}
            </span>
            <div className="flex items-center">
              <button
                className="cursor-default opacity-50 hover:opacity-100"
                onClick={() => toggleIsCrafting()}
              >
                <FontAwesomeIcon icon={faXmark} className="h-4" />
              </button>
            </div>
          </div>
          <ItemEditor
            defaultQuantity={Number(amount)}
            item={neededKeyItem}
            maxQuantity={KEY_MAX_QUANTITY}
            onDismiss={toggleIsCrafting}
            onSubmit={craft}
            type="craft"
          />
        </Modal>
      )}
    </div>
  );
}
